import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Cell from './components/Cell/Cell';
import { CellConfig } from './data/CellConfig';
import sanitizeHtml from "sanitize-html";
import { type } from '@testing-library/user-event/dist/type';
import { parse, v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import ObjectID from 'bson-objectid';
import { render } from '@testing-library/react';

// to fold all code blocks, press Ctrl+K, then press Ctrl+0

const App = () => {

  /////////////////////////////////////////////////////////////////////////////////////////////
  // CONSTANTS
  /////////////////////////////////////////////////////////////////////////////////////////////

  const testUser = '662aabfff919a72819aa37be';
  const apiURL = process.env.REACT_APP_API_URL;

  /////////////////////////////////////////////////////////////////////////////////////////////
  // STATE
  /////////////////////////////////////////////////////////////////////////////////////////////

  const ASPECT_RATIO = 16/9;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0); 

  const [operations, setOperations] = useState([]);
  const [history, setHistory] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);

 
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [pages, setPages] = useState([]);
  const [modules, setModules] = useState([]);
  const [cells, setCells] = useState(new Map([
    ['app', {
      // make this basically a copy of the props that are in 'app' state above
      _id: 'app',
      type: 'app',
      defaultState: 'live',
      currentState: 'live',
      activeModule: null,
      childCells: ['canvas', 'nav-bar'],
      theme: 'app',
      colors: [
        '#B80000',
        '#DA3E00',
        '#FCCA00',
        '#008B01',
        '#009488',
        '#00D0A3',
        '#01BCD4',
        '#1991C8',

        '#EB9694',
        '#FAD0C3',
        '#FEF3BD',
        '#C1E1C5',
        '#B2E5E1',
        '#B5EDE2',
        '#B3E0E5',
        '#B3D5E5',

        '#EBC9C7',
        '#FADED4',
        '#FFFBD9',
        '#CCE0D0',
        '#C8E6E5',
        '#CEEDE9',
        '#D3EEF2',
        '#D3E6F0',

        '#FFFFFF',
        '#F4F3F6',
        '#E3E1E9',
        '#D3D1D8',
        '#94939C',
        '#5D5C65',
        '#414546',
        '#0F161C'
      ],
    }],
    ['nav-bar', 
      {
        _id: 'nav-bar',
        type: 'menu',
        parent: null,
        defaultState: 'normal',
        currentState: 'normal',
        value: 'nav-bar',
        state: {
          base: {
            position: 'absolute',
            backgroundColor: 'lightgray',
            top: '0px',
            left: '0px',
            height: `29px`,
            width: '100%',
          },
          normal: {
            backgroundColor: 'lightgray',
          },
        },
        childCells: ['design-toggle-button'],
    }],
    ['design-toggle-button',
      {
        _id: 'design-toggle-button',
        type: 'content',
        parent: 'nav-bar',
        value: 'Design',
        formula: null,
        contentEditable: true,
        defaultState: 'normal',
        currentState: 'normal',
        state: {
          base: {
            position: 'absolute',
            backgroundColor: 'lightgray',
            top: '0px',
            left: '0px',
            height: `20px`,
            width: '100px',
            horizAlign: 'end',
          },
          normal: {
            backgroundColor: 'lightblue',
          },
          hover: {
            backgroundColor: 'blue',
          }
        },
        // eventOperations: [
        //   {
        //     id: 'toggle-design-mode',
        //     triggerType: 'click',
        //     opType: 'state',
        //     targetStruct: 'cells',
        //     targetKey: 'app',
        //     params: {
        //       targetProp: `=[cells][app][currentState]`,
        //       onPropValue: 'design',
        //       offPropValue: 'live',
        //     },
        //   },
        // ],
    }],
    ['cell-tree',
      {
        _id: 'cell-tree',
        type: 'menu',
        parent: null,
        value: null,
        formula: null,
        defaultState: 'normal',
        currentState: 'normal',
      }],
    // MARK: canvas
    ['canvas',
      {
        _id: 'canvas',
        type: 'canvas',
        parent: null,
        value: null,
        formula: null,
        defaultState: 'normal',
        currentState: 'normal',
        state: {
          base: {
            position: 'relative',
            top: '30px',
            left: '30px',
            height: '0px',
            width: '0px',
            gridSize: 0,
            gridColor: 'lightgray',
            gridVisible: false,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
          },
          normal: {
            gridVisible: true,
          },
        },
        rowCount: 1,
        rowOffset: 0,
        columns: [
          { width: '100px' },
          { width: '50px' },
          { width: '200px' },
        ],
        rows: [
          // {
          //   _id: 'row0',
          //   nestLevel: 0,
          //   currentState: 'base',
          //   state: {
          //     base: {
          //       height: '100px',
          //       backgroundColor: 'lightblue',
          //       left: '30px',
          //       top: '30px',
          //     },
          //     hover: {
          //       height: '100px',
          //       backgroundColor: 'blue',
          //     },
          //   },
          //   // style: {
          //   //   height: '500px',
          //   //   width: '500px',
          //   //   top: '20px',
          //   //   left: '20px',
          //   // },
          //   cells: [
          //     { _id: 'cell000', cell: 'C1Cell', value: 'C1 Test', rowSpan: 1, colSpan: 1, currentState: 'base' },
          //     { _id: 'cell001', cell: null, value: 'C2 Test', rowSpan: 1, colSpan: 1, currentState: 'base' },
          //     { _id: 'cell002', cell: null, value: 'C3 Test', rowSpan: 1, colSpan: 1, currentState: 'base' },
          //   ],
          //   cellsState: {
          //     base: {
          //       backgroundColor: 'red',
          //       border: '1px solid black',
          //     },
          //     hover: {
          //       backgroundColor: 'orange',
          //     }
          //   }
          // }
        ],
        childCells: [ '001-module' ],
        cellResizeHandles: true,
        cellResizeFixedWidth: true,
        cellResizeFixedHeight: false,
        cellResizeWidth: 5,
        cellResizeN: true,
        cellResizeE: false,
        cellResizeW: false,
        cellResizeS: true,
        eventOperations: [
          {
            id: 'canvas-resize-0',
            triggerType: 'drag',
            opType: 'state',
            targetStruct: 'cells',
            targetKey: 'canvas',
            targetProp: null,
            func: 'dragResize',
            params: {
              targetPropX: `[cells][canvas][columns[$col].width]`,
              targetPropY: `[cells][canvas][rows[$row].state.base.height]`,
            },
          },
        ],
    }],
    ['001-module',
      {
        _id: '001-module',
        type: 'module',
        parent: 'canvas',
        value: null,
        formula: null,
        defaultState: 'base',
        currentState: 'base',
        activeTab: null,
        state: {
          base: {
            position: 'absolute',
            backgroundColor: 'red',
            top: '20px',
            left: '20px',
            height: '300px',
            width: '500px',
          },
        },
        childCells: ['repeater-test', '001-title'],
    }],
    ['001-title', {
      _id: '001-title',
      type: 'content',
      parent: '001-module',
      value: 'Module Title',
      formula: null,
      defaultState: 'base',
      currentState: 'base',
      state: {
        base: {
          position: 'absolute',
          top: '0px',
          left: '0px',
          height: '30px',
          width: '150px',
          horizAlign: 'center',
          vertAlign: 'center',
          backgroundColor: 'lightyellow',
        },
      },
    }],
    ['repeater-test', {
      id: 'repeater-test',
      type: 'container',
      parent: 'canvas',
      value: null,
      formula: null,
      defaultState: 'normal',
      currentState: 'normal',
      fixedWidth: true,
      fixedHeight: true,
      state: {
        base: {
          position: 'absolute',
          top: '50px',
          left: '0px',
          height: `=sum([cells][repeater-test][rows[0].state['base'].height]:[cells][repeater-test][rows[1].state['base'].height])`,
          width: `=sum([cells][repeater-test][columns[0].width]:[cells][repeater-test][columns[1].width])`,
          backgroundColor: 'lightblue',
        },
        normal: {
        },
        hover: {
        },
      },
      columns: [
        { width: '250px' },
        { width: '250px' },
      ],
      rowCount: 2,
      rows: [
        {
          _id: 'dataRow1',
          nestLevel: 0,
          currentState: 'base',
          state: {
            base: {
              height: '125px',
              backgroundColor: 'white',
            },
          },
          cells: [
            { _id: 'cell001', cell: null, value: 'A', rowSpan: 1, colSpan: 1, cellResizeS: false },
            { _id: 'cell002', cell: null, value: 'B', rowSpan: 1, colSpan: 1, cellResizeW: false },
          ],
        },
        {
          _id: 'dataRow2',
          nestLevel: 0,
          currentState: 'base',
          state: {
            base: {
              height: '125px',
              backgroundColor: 'white',
            },
          },
          cells: [
            { _id: 'cell003', cell: null, value: 'C', rowSpan: 1, colSpan: 1, cellResizeS: false, cellResizeW: false },
            { _id: 'cell004', cell: null, value: 'D', rowSpan: 1, colSpan: 1, cellResizeS: false, cellResizeW: false },
          ],
        },
      ],
      cellResizeHandles: true,
      cellResizeWidth: 5,
      cellResizeN: false,
      cellResizeE: false,
      cellResizeW: true,
      cellResizeS: true,
      data: [
        { 'Country': 'Belgium', 'CRO': 'A', '# of Sites': 18 },
        { 'Country': 'Belgium', 'CRO': 'B', '# of Sites': 10 },
        { 'Country': 'France', 'CRO': 'B', '# of Sites': 12 },
        { 'Country': 'Germany', 'CRO': 'A', '# of Sites': 15 },
        { 'Country': 'United States', 'CRO': 'A', '# of Sites': 20 },
        { 'Country': 'United States', 'CRO': 'B', '# of Sites': 25 },
      ],
      ranges: [
        { name: 'Country', data: `=[cells][repeater-test][data]`, func: 'uniqueValues', field: 'Country', sort: 'asc', values: [] },
        { name: 'CRO', data: `=[cells][repeater-test][data]`, func: 'uniqueValues', field: 'CRO', sort: 'asc', values: [] },
        { name: '# of Sites', data: `=[cells][repeater-test][data]`, func: 'rangeSubdivision', field: '# of Sites', aggregation: 'sum', subdivisionTarget: `=[cells][repeater-test-y-axis][state.base.height]`, min: 'auto', max: 'auto', sort: 'asc', values: [] },
      ],
      eventOperations: [
        {
          id: 'repeater-test-resize-0',
          triggerType: 'drag',
          opType: 'state',
          targetStruct: 'cells',
          targetKey: 'repeater-test',
          targetProp: null,
          func: 'dragResize',
          params: {
            targetPropX: `[cells][repeater-test][columns[$col].width]`,
            targetPropY: `[cells][repeater-test][rows[$row].state.base.height]`,
          },
        },
      ],
    }],
    ['repeater-test-y-axis', {
      id: 'repeater-test-y-axis',
      type: 'repeater',
      parent: 'repeater-test',
      value: null,
      formula: null,
      defaultState: 'normal',
      currentState: 'normal',
      state: {
        base: {
          position: 'absolute',
          top: '0px',
          left: '0px',
          height: '300px',
          width: '100px',
          backgroundColor: 'lightyellow',
        },
        normal: {
        },
        hover: {
        },
      },
    }],
    ['000-module',
      {
        _id: '000-module',
        type: 'module',
        parent: 'canvas',
        value: null,
        formula: null,
        defaultState: 'normal',
        currentState: 'normal',
        activeTab: 'tab1cells',
        state: {
          base: {
            position: 'absolute',
            backgroundColor: 'red',
            top: '20px',
            left: '20px',
            height: '500px',
            width: '500px',
          },
          normal: {
          },
          hover: {
          }
        },
        rowHeaders: 'tab1rowheaders',
        colHeaders: 'tab1colheaders',
        rowCount: 1,
        rowOffset: 0,
        rows: [
          // {
          //   _id: 'dataRow1',
          //   nestLevel: 0,
          //   currentState: 'base',
          //   state: {
          //     base: {},
          //     hover: {},
          //   },
          //   style: {
          //   },
          //   cells: [
          //     { _id: 'tab1ColHeaders', cell: 'tab1colheaders', value: null, rowSpan: 1, colSpan: 1, merged: false, currentState: 'base'  },
          //     { _id: 'tab1RowHeaders', cell: 'tab1rowheaders', value: null, rowSpan: 1, colSpan: 1, merged: false, currentState: 'base'  },
          //     { _id: 'tab1Cells', cell: 'tab1cells', value: null, rowSpan: 1, colSpan: 1, merged: false, currentState: 'base'  },
          //   ],
          // }, 
        ],
    }],
    ['tab1colheaders',
      {
        _id: 'tab1-col-headers',
        type: 'container',
        parent: '000-module',
        value: null,
        formula: null,
        contentEditable: false,
        defaultState: 'normal',
        currentState: 'normal',
        state: {
          base: {
            position: 'absolute',
            top: '0px',
            left: '29px',
            height: '30px',
            width: `=sum([cells][tab1colheaders][columns[0].width]:[cells][tab1colheaders][columns[3].width])`,
            border: '1px solid blue',
          },
          normal: {
            backgroundColor: 'white',
          },
          hover: {
            backgroundColor: 'green',
          }
        },
        columns: [
          { width: '30px' },
          { width: '60px' },
          { width: '70px' },
          { width: '30px' },
        ],
        rowCount: 1,
        rowOffset: 0,
        rows: [
          {
            _id: 'dataRow1',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
                overflow: 'visible',
                backgroundColor: 'transparent',
              },
              hover: {
                backgroundColor: 'blue',
              },
            },
            style: {
              height: '30px',
              overflow: 'visible',
            },
            cells: [
              { _id: 'cell001', cell: null, value: 'A', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cell002', cell: null, value: 'B', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cell002', cell: null, value: 'C', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cell004', cell: null, value: 'D', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
            ],
            cellsState: {
              base: {
                backgroundColor: 'transparent',
              },
              hover: {
                backgroundColor: 'transparent',
              }
            },
          },
        ],
        cellResizeHandles: false,
        cellResizeWidth: 5,
        cellResizeN: false,
        cellResizeE: false,
        cellResizeW: true,
        cellResizeS: false,
        eventOperations: [
          {
            id: 'cell-resize-0',
            triggerType: 'drag',
            opType: 'state',
            targetStruct: 'cells',
            targetKey: 'tab1colheaders',
            targetProp: null,
            func: 'dragUpdate',
            params: {
              targetPropX: `[cells][tab1colheaders][columns[$col].width]`,
            },
          },
        ],
      }
    ],
    [
      'tab1rowheaders',
      {
        _id: '000-row-headers',
        type: 'container',
        parent: '000-module',
        value: null,
        formula: null,
        contentEditable: false,
        defaultState: 'normal',
        currentState: 'normal',
        state: {
          base: {
            position: 'absolute',
            top: '29px',
            left: '0px',
            height: '120px',
            width: '30px',
          },
          normal: {
            backgroundColor: 'blue',
          },
          hover: {
          }
        },
        columns: [
          { width: '30px' },
        ],
        rowCount: 4,
        rowOffset: 0,
        rows: [
          {
            _id: 'dataRow1',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
              },
              hover: {
              }
            },
            style: {
              height: '30px',
              border: '1px solid blue',
            },
            cells: [
              { _id: 'cell001', cell: null, value: '1', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base'  },
            ],
            cellsState: {
              base: {
              },
              hover: {
              }
            },
          }, 
          {
            _id: 'dataRow2',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
                border: '1px solid blue',
              },
            },
            style: {
              height: '30px',
              border: '1px solid blue',
            },
            cells: [
              { _id: 'cell002', cell: null, value: '2', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base'  },
            ],
            cellsState: {
              base: {
                backgroundColor: 'lightgray',
                border: '1px solid blue',
              },
              hover: {
                backgroundColor: 'lightblue',
              }
            },
          }, 
          {
            _id: 'dataRow3',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
                border: '1px solid blue',
              },
            },
            style: {
              height: '30px',
              border: '1px solid blue',
            },
            cells: [
              { _id: 'cell003', cell: null, value: '3', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base'  },
            ],
            cellsState: {
              base: {
                backgroundColor: 'lightgray',
              },
              hover: {
                backgroundColor: 'lightblue',
              }
            },
          }, 
          {
            _id: 'dataRow4',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
                border: '1px solid blue',
              },
            },
            style: {
              height: '30px',
              border: '1px solid blue',
            },
            cells: [
              { _id: 'cell004', cell: null, value: '4', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base'  },
            ],
            cellsState: {
              base: {
                backgroundColor: 'lightgray',
              },
              hover: {
                backgroundColor: 'lightblue',
              }
            },
          }, 
        ]
      }
    ],
    ['C1Cell',
      {
        _id: 'C1Cell',
        type: 'content',
        parent: 'tab1cells',
        value: null,
        formula: `=[cells][tab1colheaders][columns[12].width]`,
        defaultState: 'normal',
        currentState: 'normal',
        state: {
          base: {
            position: 'absolute',
            top: '-100px',
            left: '-30px',
            height: '100px',
            width: '100px',
            border: '1px solid black',
            horizAlign: 'start',
            vertAlign: 'center',
          },
          normal: {
            backgroundColor: `lightgreen`,
          },
          hover: {
            backgroundColor: 'yellow',
          }
        },
      }
    ],
    ['tab1cells',
      {
        _id: 'tab1cells',
        type: 'container',
        parent: '000-module',
        value: null,
        formula: null,
        contentEditable: false,
        defaultState: 'normal',
        currentState: 'normal',
        state: {
          base: {
            position: 'absolute',
            top: '29px', //10 * ASPECT_RATIO + '%',
            left: '29px',
            height: '120px', // 30 * ASPECT_RATIO + '%',
            width: `=sum([cells][tab1colheaders][columns[0].width]:[cells][tab1colheaders][columns[3].width])`, //'50%',
            // overflowX: 'scroll',
            // overflowY: 'hidden',
            // scrollbarHeight: '5px',
          },
          normal: {
            backgroundColor: 'white',
          },
        },
        cursorBox: true,
        cursorCol: 0,
        cursorRow: 0,
        cursorColSpan: 1,
        cursorRowSpan: 1,
        mergedColContext: null,
        mergedRowContext: null,
        selectionBox: true,
        selectionCol: 0,
        selectionRow: 0,
        selectionColSpan: 1,
        selectionRowSpan: 1,
        selectionColStepDirection: null,
        selectionRowStepDirection: null,
        columns: [
          { width: `=[cells][tab1colheaders][columns[$index].width]` },
          { width: `=[cells][tab1colheaders][columns[$index].width]` },
          { width: `=[cells][tab1colheaders][columns[$index].width]` },
          { width: `=[cells][tab1colheaders][columns[$index].width]` },
        ],
        colCount: 4,
        rowCount: 4,
        rowOffset: 0,
        rows: [
          {
            _id: 'dataRow1',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
                border: '1px solid blue',
              },
              hover: {
                backgroundColor: 'lightblue',
              }
            }, 
            style: {
              height: '30px',              
              backgroundColor: 'transparent',
            },
            cells: [
              { _id: 'cellr0c0', cell: null, value: 'A1', rowSpan: 1, colSpan: 2, merged: false, anchorCol: 0, anchorRow: 0, currentState: 'base' },
              { _id: 'cellr0c1', cell: null, value: 'B1', rowSpan: 1, colSpan: 1, merged: true, anchorCol: 0, anchorRow: 0, currentState: 'base' },
              { _id: 'cellr0c2', cell: null, value: 'C1', rowSpan: 3, colSpan: 1, merged: false, anchorCol: 2, anchorRow: 0, currentState: 'base' },
              { _id: 'cellr0c3', cell: null, value: '3', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
            ],
            cellsState: {
              base: {
                backgroundColor: 'transparent',
              },
              hover: {
                backgroundColor: 'lightblue',
              }
            },
          }, 
          {
            _id: 'dataRow2',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
                border: '1px solid blue',
              },
            }, 
            style: {
              height: '30px',          
              border: '1px solid blue',
            },
            cells: [
              { _id: 'cellr1c0', cell: null, value: 'A2', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cellr1c1', cell: null, value: 'B2', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cellr1c2', cell: null, value: 'C2', rowSpan: 1, colSpan: 1, merged: true, anchorCol: 2, anchorRow: 0, currentState: 'base' },
              { _id: 'cellr1c3', cell: null, value: '6', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
            ],
            cellsState: {
              base: {
                backgroundColor: 'transparent',
              },
              hover: {
                backgroundColor: 'lightblue',
              }
            },
          }, 
          {
            _id: 'dataRow3',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
                border: '1px solid blue',
              },
            }, 
            style: {
              height: '30px',              
              backgroundColor: 'white',
              border: '1px solid blue',
            },
            cells: [
              { _id: 'cellr2c0', cell: null, value: 'A3', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cellr2c1', cell: null, value: 'B3', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cellr2c2', cell: null, value: 'C3', rowSpan: 1, colSpan: 1, merged: true, anchorCol: 2, anchorRow: 0, currentState: 'base' },
              { _id: 'cellr2c3', cell: null, value: '2', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
            ],
            cellsState: {
              base: {
                backgroundColor: 'transparent',
              },
              hover: {
                backgroundColor: 'lightblue',
              }
            },
          },   
          {
            _id: 'dataRow4',
            nestLevel: 0,
            currentState: 'base',
            state: {
              base: {
                height: '30px',
                border: '1px solid blue',
              },
            }, 
            style: {
              height: '30px',              
              backgroundColor: 'white',
              border: '1px solid blue',
            },
            cells: [
              { _id: 'cellr3c0', cell: null, value: 'A4', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cellr3c1', cell: null, value: 'B4', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cellr3c2', cell: null, value: 'C4', rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
              { _id: 'cellr3c3', cell: null, value: `=count([cells][tab1colheaders][columns[0].width]:[cells][tab1colheaders][columns[3].width])`, rowSpan: 1, colSpan: 1, merged: false, currentState: 'base' },
            ],
            cellsState: {
              base: {
                backgroundColor: 'transparent',
              },
              hover: {
                backgroundColor: 'lightblue',
              }
            },
          },     
        ],
        eventOperations: [
          {
            id: 'arrow-key-0',
            triggerType: 'arrowKey',
            opType: 'state',
            targetStruct: 'cells',
            targetKey: 'tab1cells',
            targetProp: null,
            func: 'moveCursor',
            params: {},
          },
          {
            id: 'click-0',
            triggerType: 'click',
            opType: 'state',
            targetStruct: 'cells',
            targetKey: 'tab1cells',
            targetProp: null,
            onPropValue: `=moveCursor("tab1cells", "click", "coords")`,
            func: 'moveCursor',
          params: {},
          },
          {
            id: 'cell-click-shift-0',
            triggerType: 'clickShift',
            opType: 'state',
            targetStruct: 'cells',
            targetKey: 'tab1cells',
            targetProp: null,
            onPropValue: `=moveCursor("tab1cells", "clickShift", "coords")`,
            func: 'moveCursor',
            params: {},
          }
        ]
      }
    ],
  ]));


  // const stateMappingRef = useRef({
  //   organizations,
  //   users,
  //   workspaces,
  //   pages,
  //   modules,
  //   cells
  // });


  /////////////////////////////////////////////////////////////////////////////////////////////
  // USE EFFECT
  /////////////////////////////////////////////////////////////////////////////////////////////


  // ensure appDiv is focused to receive key inputs on load
  const appDivRef = useRef(null);
  useEffect(() => {
    if (appDivRef.current) {
      appDivRef.current.focus();
    }
  }, []);

  // On app load / login, set currentUser
  useEffect(() => {

    const loadOperations = [
      {
        id: 'load-retrieve-user',
        opType: 'retrieve',
        db: 'app_db',
        collection: 'users',
        formula: `[_id] = '` + testUser + `'`,
        references: [
          { reference: `[testUsers]!testUser1.id`, value: null },
        ],
        predecessor: null,
        result: null,
        status: 'ready',
      },
      // {
      //   id: 'load-retrieve-organization',
      //   type: 'retrieve',
      //   db: 'app_db',
      //   collection: 'organizations',
      //   formula: `organizationId = '{{operations['load-retrieve-user'].result[0].organizationId}}'`,
      //   predecessor: operations['load-retrieve-user'],
      //   result: null,
      //   status: 'ready',
      // }
    ]
    

    // const testFormula = `=5 + 3 * 2`;
    // const tokens = tokenizer(testFormula);
    // console.log('tokens ', tokens);
    // const ast = parseTokens(tokens);
    // console.log('ast ', ast);
    // const result = evaluateTokens(ast);
    // console.log('result ', JSON.stringify(result, null, 2));

    //addOperations(loadOperations);
    
  }, []);

  // manage operations
  useEffect(() => {

    const processOperations = async () => {

      // temporary store for updates
      const updatedCells = new Map(cells);
      const updatedWorkspaces = new Map(workspaces);


      // sub function to update props in state
      const updateStructState = (operation, updatedStruct) => {

        // Helper function to recursively get the current nested property value
        const getNestedProperty = (obj, pathArray) => {
          console.log('getNestedProperty. operation: ', operation, 'obj: ', obj, 'pathArray: ', pathArray);
          return pathArray.reduce((acc, key) => (acc && acc[key] !== 'undefined') ? acc[key] : undefined, obj);
        }

        // Helper function to recurisvely update the nested property
        const updateNestedProperty = (obj, pathArray, value) => {
          let current = obj;

          for (let i = 0; i < pathArray.length - 1; i++) {
            let key = pathArray[i];

            // Determine if next key is index or property
            const nextKeyIsIndex = typeof pathArray[i + 1] === 'number';

            // Initialize next level if it doesn't exist
            if (!(key in current)) {
              current[key] = nextKeyIsIndex ? [] : {};
            }

            current = current[key];
          }

          // Set the value at the deepest level
          current[pathArray[pathArray.length - 1]] = value;
        }

        const targetStruct = operation.targetStruct;
        const targetKey = operation.targetKey;
        let targetPropPath = null;

        if (operation.targetProp) {
          targetPropPath = operation.targetProp.split('.');
        }

        // Check if object exists in updatedStruct
        if (updatedStruct.has(targetKey)) {
          const target = updatedStruct.get(targetKey);

          // If operation has a func instead of onPropValue, execute it directly
          if (operation.func) {
            const funcResult = executeFunc(operation.func, targetStruct, targetKey, operation.params);

            // Clone the target object to ensure immutability
            const updatedTarget =  { ...target };

            // Iterate thru funcResult and update nested props
            Object.keys(funcResult).forEach(key => {
              const value = funcResult[key];

              // Parse the property path
              const propPath = parsePropertyPath(key);

              updateNestedProperty(updatedTarget, propPath, value);
            });

            // Update map with modified object
            updatedStruct.set(targetKey, updatedTarget);
            
            return;
          }

          // If not a func call, proceed with property updates

          // Clone the cell object to ensure immutability
          const updatedTarget = { ...target };

          // Get the current value of the target property
          const currentValue = getNestedProperty(updatedTarget, targetPropPath);

          // Determine the new value of the target property and handle toggling
          let onPropCalc = operation.onPropValue;
          if (typeof onPropCalc === 'string' && onPropCalc.startsWith('=')) {
            onPropCalc = convertFormula(onPropCalc);
          }

          let offPropCalc = operation.offPropValue ? operation.offPropValue : null;
          if (typeof offPropCalc === 'string' && offPropCalc.startsWith('=')) {
            offPropCalc = convertFormula(offPropCalc);
          }

          const newValue = (currentValue === onPropCalc && offPropCalc) ? offPropCalc : onPropCalc;

          updateNestedProperty(updatedTarget, targetPropPath, newValue);

          // Update the map with modified cell
          updatedStruct.set(targetKey, updatedTarget);
        };
      };

      // iterate through operations, process and update status
      for (const operation of operations) {

        if (operation.status === 'ready') {

          // update the operation status to started
          setOperations(prevOps => {
            return prevOps.map(op =>
              op.id === operation.id ? { ...op, status: 'started' } : op
            );
          });

          let result;

          // handle CRUD operations asynchronously
          if (operation.opType === 'retrieve') {
            result = await apiRetrieve(operation.db, operation.collection, operation.formula, operation.references);
          }

          // update state of core structures
          if (operation.opType === 'state') {
            switch(operation.targetStruct) {
              case 'cells':
                updateStructState(operation, updatedCells);
                break;
              case 'workspaces':
                updateStructState(operation, updatedWorkspaces);
                break;
              default:
                console.log('targetStruct not found');
            }
          }

          // move operation from 'started' to 'complete' and promote its immediate children to 'ready'
          setOperations(prevOps => {
            const newOps = prevOps.map(op => {
              if (op.id === operation.id) {
                if (operation.triggerType === 'drag') {
                  // Do not set to 'complete'
                  return op;
                }
                else {
                  // Otherwise set to complete
                  return { ...op, status: 'complete' };
                }
              }
              else {
                return op;
              }
          });

            // promote children to 'ready' only if op is not 'drag'
            if (operation.triggerType !== 'drag' && operation.eventOperations) {
              operation.eventOperations.forEach(eventOp => {
                const childIndex = newOps.findIndex(op => op.id === eventOp.id);
                if (childIndex !== -1) {
                  newOps[childIndex].status = 'ready';
                }
              });
            }

            return newOps;
          });
        }
      }

      // Check for complete operations and remove those with no incomplete children
      setOperations(prevOps => {
        // Check if all operations are complete
        const allOperationsComplete = prevOps.every(op => op.status === 'complete');

        // Only proceed with filtering if all operations are complete
        if (allOperationsComplete) {
          return [];
        }

        // If not all operations are complete, return the original array
        return prevOps;
      });

      // update state for all core structs
      setCells(updatedCells);
      // add more states as needed
    };

    // if (operations.some(op => op.status === 'ready' || op.status === 'started')) {
    //   processOperations();
    // }
    if (operations.length > 0) {
      processOperations();
    }

  }, [operations]);


  // useEffect(() => {
  //   console.log('operations updated', operations);
  // }, [operations]);


  // canvas & grid resize
  useEffect(() => {

    const canvasResize = () => {
      const navBarCell = cells.get('nav-bar');
      const canvasCell = cells.get('canvas');

      if (!navBarCell || !canvasCell) {
        return;
      }

      const newCanvasHeight = window.innerHeight - parseInt(navBarCell.state.base.height) - (parseInt(canvasCell.state.base.top) * 2); //parseInt(navBarCell.state.base.top);
      const newCanvasWidth = newCanvasHeight * ASPECT_RATIO;
      const newCanvasLeft = (window.innerWidth - newCanvasWidth) / 2;

      setCells(prevCells => {
        const newCells = new Map(prevCells);

        const updatedCanvasCell = {
          ...canvasCell,
          state: {
            ...canvasCell.state,
            base: {
              ...canvasCell.state.base,
              gridSize: newCanvasHeight / 56.25,
              height: `${newCanvasHeight}px`,
              width: `${newCanvasWidth}px`,
              left: `${newCanvasLeft}px`,
            }
          }
        };

        newCells.set('canvas', updatedCanvasCell);
        return newCells;
      });
    };

    canvasResize();
    window.addEventListener('resize', canvasResize);

    return () => {
      window.removeEventListener('resize', canvasResize);  
    };
  }, []);

  
  // hidden code to load things from the DB
  // useEffect(() => {

    // const operationIds = Array.from({ length: 6}, () => ObjectID());

    // const loadOperations = [
    //   { id: operationIds[0], type: "retrieve", db: 'app_db', collection: 'users', formula: `_id = '662aabfff919a72819aa37be'`, result: null },
    //   { id: operationIds[1], type: 'getOrganization', params: { db: 'app_db', collection: 'organizations', field: 'organizationId', records: '{{loadOperations[0].result[0].organizationId}}'}, result: null },
    // ]

    // const fetchData = async () => {

    //   // step 1: Fetch user
    //   const user = await apiGetUsers([testUserId]);
    //   if (user) {
    //     setCurrentUser(testUserId);
    //     setUsers(prevUsers => {
    //       if (!prevUsers.some(prevUser => prevUser._id === user._id)) {
    //         return [
    //           ...prevUsers,
    //           user[0]
    //         ];
    //       }
    //       return prevUsers;
    //     });

    //     // step 2: fetch organization
    //     const organization = await apiGetOrganizations([user[0].organizationId]);
    //     if (organization) {
    //       setCurrentOrganization(organization);
    //       setOrganizations(prevOrganizations => {
    //         if (!prevOrganizations.some(prevOrganization => prevOrganization._id === organization._id)) {
    //           return [
    //             ...prevOrganizations,
    //             organization
    //           ];
    //         }
    //         return prevOrganizations;
    //       });
    //     }
    //   }
    // };

    // fetchData();


    // const loadAppModules = async () => {
    //   const appModules = await apiGetModules('app_db', 'modules', ['nav-bar']);
    //   setModules(prevModules => {
    //     const newModules = appModules.filter(appModule => 
    //       !prevModules.some(prevModule => prevModule === appModule)
    //     );
    //     return [
    //       ...prevModules,
    //       ...newModules
    //     ];
    //   });
    // };

  // }, []);


  // // user changed
  // useEffect(() => {
  //   console.log('user changed', user);

  //   // trigger change of organization
  //   const fetchOrganization = async () => {
  //     console.log('fetchOrganization');
  //     if (!user) {
  //       return;
  //     }

  //     const organization = await apiGetOrganization(user.organizationId);
  //     setOrganization(organization);
  //   };

  //   fetchOrganization();
  // }, [user]);


  // // organization changed
  // useEffect(() => {
  //   console.log('organization changed', organization);

  //   // trigger change of current workspace
  //   const fetchCurrentWorkspace = async () => {
  //     if (!organization) {
  //       return;
  //     }
        
  //     const workspace = await apiGetWorkspace(organization.defaultWorkspaceId);
  //     setCurrentWorkspace(workspace);
  //   };

  //   fetchCurrentWorkspace();
  // }, [organization]);


  // // workspace changed
  // useEffect(() => {
  //   console.log('currentWorkspace changed', currentWorkspace);

  //   // trigger change of currentPage
  //   const fetchCurrentPage = async () => {
  //     if (!currentWorkspace) {
  //       return;
  //     }
        
  //     const page = currentWorkspace.pages[0];
  //     setCurrentPage(page);
  //   };

  //   // trigger load of all pages in workspace
  //   const loadPages = async () => {
  //     if (!currentWorkspace) {
  //       return;
  //     }

  //     const pageIds = currentWorkspace.pages;
  //     const pages = await apiGetPages(pageIds);
  //     setPages(pages);
  //   };

  //   fetchCurrentPage();
  //   loadPages();
  // }, [currentWorkspace]);


  // // currentPage changed
  // useEffect(() => {
  //   console.log('currentPage changed', currentPage);
  // }, [currentPage]);


  // // pages changed
  // useEffect(() => {
  //   console.log('pages changed', pages);

  //   if (pages.length === 0) {
  //     return;
  //   }

  //   const moduleIds = pages.reduce((acc, page) => {
  //     return acc.concat(page.modules);
  //   }, []);

  //   // trigger load of all modules on all pages of workspace
  //   const fetchModules = async () => {
  //     if (moduleIds.length === 0) {
  //       return;
  //     }
  //     const dbId = organization._id + '_db';
  //     const collectionId = dbId + '_modules';
  //     const modules = await apiGetModules(dbId, collectionId, moduleIds);
  //     // call setModules but preserve modules that have already been loaded if prevModule has pageId === 'app' or currentPage
  //     setModules((prevModules) => {
  //       const preservedModules = prevModules.filter((prevModule) => {
  //         return prevModule.pageId === 'app' || prevModule.pageId === currentPage
  //       });

  //       return preservedModules.concat(modules);
  //     });
  //   };

  //   fetchModules();
  // }, [pages]);


  // // modules changed
  // useEffect(() => {
  //   console.log('modules changed', modules);

  //   // trigger load of all cells in all modules, for the current page only
  //   const fetchCells = async () => {
  //     if (modules.length === 0) {
  //       return;
  //     }

  //     const cellIds = modules.reduce((acc, module) => {
  //       const dbId = module.pageId === 'app' ? 'app_db' : organization._id + '_db';
  //       const collectionId = module.pageId === 'app' ? 'modules' : dbId + '_modules';

  //       const moduleCells = module.cells.map(cellId => ({ cellId, dbId, collectionId });
  //       return acc.concat(module.cells);
  //     }, []);

  //     if (cellIds.length === 0) {
  //       return;
  //     }

  //     const dbId =  organization._id + '_db';
  //     const collectionId = dbId + '_modules';
  //     const cells = await apiGetCells(dbId, collectionId, cellIds);
  //     setCells(cells);
  //   };

  //   fetchCells();
  // }, [modules]);


  // // cells changed
  // useEffect(() => {
  //   console.log('cells changed', cells);
  // }, [cells]);


  /////////////////////////////////////////////////////////////////////////////////////////////
  // PARSER
  /////////////////////////////////////////////////////////////////////////////////////////////


  // convert formula to a value
  const convertFormula = (formula, parentStruct = null, parentKey = null) => {
    const tokens = tokenizer(formula);
    const ast = parseTokens(tokens);
    return evaluateTokens(ast, parentStruct, parentKey);
  }


  // Parse property strings like 'columns[2].width' in array of keys
  const parsePropertyPath = (path) => {
    const result = [];
    const regex = /(\w+)|\[(\d+)\]/g;
    let match;

    while ((match = regex.exec(path)) !== null) {
      if (match[1]) {
        result.push(match[1]); // matches property name
      }
      else if (match[2]) {
        result.push(Number(match[2])); // matches array index
      }
    }

    return result;
  };

  const parseReference = (ref) => {
    const isCellReference = (word) => /^[A-Za-z]+[0-9]+$/.test(word);
    const parts = ref.slice(1, -1).split('][');
        
    let struct = parts.shift();
    let key = parts.shift();


    // Check if key is a cell reference
    if (isCellReference(key)) {
      // Handle cell reference within the context
      const cell = getRowCellObj(key, { currentTableId: struct });
      key = cell._id; // Use the actual cell ID
    }

    let props = [];
    

    if (parts.length > 0) {
      const propsPath = parts.join('][');
      props = parsePropertyPath(propsPath);
    }
    else {
      props = ['value'];
    }

    return { struct, key, props };
  }


  const getReferenceValue = (ref) => {
    const { struct, key, props } = parseReference(ref);

    const stateMapping = {
      organizations,
      users,
      workspaces,
      pages,
      modules,
      cells,
    };

    const stateMap = stateMapping[struct];
    if (!stateMap) {
      return '#REF!';
    }

    const obj = stateMap.get(key);
    if (!obj) {
      return '#REF!';
    }
    let refValue = obj;

    for (let prop of props) {
      if (refValue !== null && prop in refValue) {
      refValue = refValue[prop];
      }
      else {
        return '#REF!';
      }
    }

    if (refValue === null) {
      return '#REF!';
    }

    return refValue;
  };


  const tokenizer = (formula) => {
    let tokens = [];
    let i = 0;
    const isDigit = (char) => /\d/.test(char);
    const isAlpha = (char) => /[a-zA-Z]/.test(char);
    const isAlphaNumeric = (char) => /[a-zA-Z0-9]/.test(char);
    const isWhiteSpace = (char) => /\s/.test(char);
    const isOperator = (char) => '+-*/),&<>=!:.'.includes(char);
    const isCellReference = (word) => /^[A-Za-z]+[0-9]+$/.test(word);

    // skip leading '='
    if (formula[0] === '=') {
      i++;
    }

    while (i < formula.length) {
      let char = formula[i];

      // whitespace
      if (isWhiteSpace(char)) {
        i++;
        continue;
      }

      // number
      if (isDigit(char)) {
        let numStr = '';
        while (i < formula.length && isDigit(formula[i])) {
          numStr += formula[i];
          i++;
        }
        tokens.push({ type: 'number', value: parseInt(numStr, 10) });
        continue;
      }

      // string
      if (char === '"') {
        i++; // skip opening "
        let str = "";

        while (formula[i] !== '"') {
          str += formula[i];
          i++;

          if (i === formula.length) {
            console.error('string not closed');
            return null;
          }
        }

        // skip closing "
        i++;
        tokens.push({ type: 'string', value: str });
        continue;
      }

      // operator
      if (isOperator(char)) {
        i++;
        if (char === '>' && formula[i] === '=') {
          tokens.push({ type: 'operator', value: '>=' });
          i++;
          continue;
        } else if (char === '<' && formula[i] === '=') {
          tokens.push({ type: 'operator', value: '<=' });
          i++;
          continue;
        } else if (char === '!' && formula[i] === '=') {
          tokens.push({ type: 'operator', value: '!=' });
          i++;
          continue;
        } else {
          tokens.push({ type: 'operator', value: char });
        }
        continue;
      }

      // opening '(' and list check
      if (char === '(') {
        i++;

        // check for "in" list
        if (tokens.length > 1 && tokens[tokens.length - 1].value === 'in') {
          let listString = '';
          
          while (i < formula.length && formula[i] !== ')') {
            listString += formula[i];
            i++;
          }

          i++; // skip closing ')'

          let listValues = tokenizer(listString);
          let listValuesNoComma = listValues.filter(listValue => listValue.value !== ',');
          tokens.push({ type: 'list', value: listValuesNoComma });
        }
        else {
          tokens.push({ type: 'operator', value: '(' });
        }

        continue;
      }

      // reference
      if (char === "[") {
        let refValue = '';
        while (char === '[') {
          let nestingLevel = 1;
          refValue += char; // Append the [
          i++;
          while (i < formula.length && nestingLevel > 0) {
            char = formula[i];
            refValue += char;
            i++;
            if (char === '[') {
              nestingLevel++;
            }
            else if (char === ']') {
              nestingLevel--;
            }
          }
          // After exiting the inner loop, char is already incremented
          if (i < formula.length) {
            char = formula[i];
          }
          else {
            break;
          }
        }

        tokens.push({ type: 'reference', value: refValue });

        continue;
      }

      // identifiers, functions and cell references
      if (isAlpha(char)) {
        let word = '';
        while (i < formula.length && isAlphaNumeric(formula[i])) {
          word += formula[i];
          i++;
        }

        // handle "else if" specifically
        if (word.toLowerCase() === 'else' && formula[i] === ' ' && formula.slice(i, i + 3).toLowerCase() === 'if') {
          tokens.push({ type: 'else', value: 'else' });
          tokens.push({ type: 'if', value: 'if' })
          i += 3; // skip past 'if'
          continue;
        }

        // Check if the word is a keyword
        if (['if', 'then', 'else', 'in', 'not', 'and', 'or', 'null'].includes(word.toLowerCase())) {
          tokens.push({ type: word.toLowerCase(), value: word.toLowerCase() });
          continue;
        }


        // Check if the word is a cell reference
        if (isCellReference(word)) {
          tokens.push({ type: 'cell_reference', value: word});
          continue;
        }

        // Check if the word is a function (followed by '(')
        if (formula[i] === '(') {
          tokens.push({ type: 'function', value: word });
          continue;
        }

        // otherwise, it's an identifier
        tokens.push({ type: 'identifier', value: word });
        continue;

      }

      // catch all
      else {
        i++;
      }

    };

    return tokens;
  };

  
  const parseTokens = (tokens) => {
    let current = 0;

    const parseExpression = () => {
      if (tokens[current] && tokens[current].value === 'if') {
        return parseIfExpression();
      }

      let expr = parseRange();
      
      while ((current < tokens.length) && (tokens[current].value === '&')) {
        let operator = tokens[current].value;
        current++;
        let right = parseComparison();
        expr = { type: 'BinaryExpression', operator, left: expr, right };
      }

      if (current < tokens.length && tokens[current].value === 'in') {
        return parseInExpression(expr);
      }

      if (current < tokens.length && tokens[current].value === 'not') {
        return parseNotExpression(expr);
      }

      if (current < tokens.length && tokens[current].value === 'and') {
        current++;
        const right = parseExpression();
        expr = { type: 'BinaryExpression', operator: 'and', left: expr, right };
      }

      if (current < tokens.length && tokens[current].value === 'or') {
        current++;
        const right = parseExpression();
        expr = { type: 'BinaryExpression', operator: 'or', left: expr, right };
      }

      return expr;
    };

    const parseRange = () => {
      let left = parseComparison();

      while (current < tokens.length && tokens[current].value === ':') {
        current++; // skip ':'
        let right = parseComparison();
        left = { type: 'RangeExpression', left, right };
      }

      return left;
    }

    const parseComparison = () => {
      let expr = parseTerm();

      const comparisonOperators = ['<', '>', '<=', '>=', '!=', '='];
      while (current < tokens.length && comparisonOperators.includes(tokens[current].value)) {
        let operator = tokens[current].value;
        current++;
        let right = parseTerm();
        expr = { type: 'BinaryExpression', operator, left: expr, right };
      }

      return expr;
    }

    const parseIfExpression = () => {
      current++; // skip 'if'
      let condition = null;
      let consequent = null;
      let alternate = null;

      if (tokens[current]) {
        condition = parseExpression();

        // if (!tokens[current] || tokens[current].value  !== 'then') {
        //   throw new Error('Expected "then" after condition');
        // }
        current++; // skip 'then'
        if (tokens[current]) {
          consequent = parseExpression();
        }

        alternate = { type: 'Literal', value: null }; // default to null if else part is missing

        if (tokens[current] && tokens[current].value === 'else') {
          current++;
          if (tokens[current] && tokens[current].value === 'if') {
            alternate = parseIfExpression();
          }
          else {
            alternate = parseExpression();
          }
        }
      }

      return { type: 'IfExpression', condition, consequent, alternate };
    };

    const parseTerm = () => {
      let term = parseFactor();
    
      while (current < tokens.length && (tokens[current].value === '+' || tokens[current].value === '-')) {
        let operator = tokens[current].value;
        current++;
        let right = parseFactor();
        term = { type: 'BinaryExpression', operator, left: term, right };
      }

      return term;
    };

    const parseFactor = () => {
      let factor = parsePrimary();

      while (current < tokens.length && (tokens[current].value === '*' || tokens[current].value === '/')) {
        let operator = tokens[current].value;
        current++;
        let right = parsePrimary();
        factor = { type: 'BinaryExpression', operator, left: factor, right };
      }

      return factor;
    };

    const parsePrimary = (localToken = null) => {
      let token = localToken ? localToken : tokens[current];

      if (!localToken) {
        current++;
      }

      if (token.type === 'number' || token.type === 'null') {
        return { type: 'Literal', value: token.value };
      }

      if (token.type === 'string') {
        const value = token.value.replace(/^["']|["']$/g, '');
        return { type: 'Literal', value: value, dataType: 'string' };
      }

      if (token.type === 'reference') {
        return { type: 'Reference', value: token.value };
      }

      if (token.type === 'cell_reference') {
        let node = { type: 'CellReference', name: token.value };

        // Handle property access
        while (
          tokens[current] && 
          tokens[current].type === 'operator' && 
          tokens[current].value === '.'
        ) {
          current++; // skip '.'
          let propertyToken = tokens[current];
          if (propertyToken.type === 'identifier') {
            current++;
            node = { type: 'MemberExpression', object: node, property: { type: 'Identifier', name: propertyToken.value } };
          }
          else {
            throw new Error('Expected property name after "."');
          }
        }

        if (node.type === 'CellReference') {
          node = { type: 'MemberExpression', object: node, property: { type: 'Identifier', name: 'value' }}
        }

        return node;
      }

      if (token.type === 'list') {
        let listItems = [];
        for (let item of token.value) {
          listItems.push(parseFactor(item));
        }

        return { type: 'List', value: listItems };
      }

      if (token.type === 'function') {
        if (tokens[current].value === '(') {
          current++;
          const args = parseArguments();
          if (tokens[current].value !== ')') {
            throw new Error('Expected closing parenthesis');
          }
          current++;
          return { type: 'FunctionCall', name: token.value, arguments: args };
        }
        else {
          throw new Error('Expected opening parenthesis');
        }
      }

      if (token.type === 'operator' && token.value === '(') {
        let expr = parseExpression();
        current++;
        return expr;
      }

      if (token.type === 'operator' && token.value === '-') {
        let expr = parseFactor();
        return { type: 'UnaryExpression', operator: '-', argument: expr };
      }

      //throw new Error('Unexpected token: ' + token.value);
      return { type: 'Literal', value: null };
    };

    function parseInExpression(item) {
      current++; // skip 'in'
      let list = parseTerm();
      return { type: 'InExpression', item, list };
    }

    function parseNotExpression(item) {
      current++; // skip 'not'
      if (tokens[current] && tokens[current].value === 'in') {
        current++; // skip 'in'
        const list = parseTerm();
        return { type: 'NotInExpression', item, list };
      }

      if (tokens[current] && tokens[current].value === 'null') {
        current++; // skip 'null'
        return { type: 'NotNullExpression', item };
      }
    }

    function parseArguments() {
      const args = [];
      while (current < tokens.length && tokens[current].type !== 'operator' && tokens[current].value !== ')') {
        args.push(parseExpression());
        if (tokens[current] && tokens[current].value === ',') {
          current++; // skip ',' between arguments
        }
      }
      return args;
    }

    return parseExpression();
  };


  // Helper function for moveCursor. Check for a merge and expand and update the selection box range
  const checkForMerge = (currentRow, currentCol, cell, processedCells, coords) => {
    let { topLeftRow, topLeftCol, bottomRightRow, bottomRightCol } = coords;
                
    // Mark the cell as processed
    processedCells.add(cell.rows[currentRow]?.cells[currentCol]._id);

    const nextCell = cell.rows[currentRow]?.cells[currentCol];

    // If the cell is merged, find the anchor cell and expand selection box to include the entire merged range
    if (typeof nextCell.anchorCol === 'number') {
      const anchorCell = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol];
      coords.topLeftRow = Math.min(topLeftRow, nextCell.anchorRow);
      coords.topLeftCol = Math.min(topLeftCol, nextCell.anchorCol);
      coords.bottomRightRow = Math.max(bottomRightRow, anchorCell.rowSpan === 1 ? nextCell.anchorRow : nextCell.anchorRow + anchorCell.rowSpan - 1);
      coords.bottomRightCol = Math.max(bottomRightCol, anchorCell.colSpan === 1 ? nextCell.anchorCol : nextCell.anchorCol + anchorCell.colSpan - 1);
      return true;
    }
    // If not merged, simply expand the range if applicable
    else {
      coords.topLeftRow = Math.min(topLeftRow, currentRow);
      coords.topLeftCol = Math.min(topLeftCol, currentCol);
      coords.bottomRightRow = Math.max(bottomRightRow, currentRow);
      coords.bottomRightCol = Math.max(bottomRightCol, currentCol);
      return false;
    }
  };


  // Helper function for moveCursor.  Loops through all cells in the selection box range and checks for merges
  const loopThruCells = (cell, processedCells, coords, mergeCheckComplete) => {
    const { topLeftRow, topLeftCol, bottomRightRow, bottomRightCol } = coords;
    for (let col = topLeftCol; col <= bottomRightCol; col++) {
      for (let row = topLeftRow; row <= bottomRightRow; row++) {
        if (!processedCells.has(cell.rows[row]?.cells[col]._id)) {
          if (checkForMerge(row, col, cell, processedCells, coords)) {
            mergeCheckComplete.value = false;
            return;
          }
        }
      }
    }

    mergeCheckComplete.value = true;
  }

  const setNestedProperty = (obj, path, value) => {
    const keys = parsePropertyPath(path);
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      let key = keys[i];

      // Determine if next key is an index or property
      const nextKeyIsIndex = typeof keys[i + 1] === 'number';

      // Initialize the next level if it doesn't exist
      if (!(key in current)) {
        current[key] = nextKeyIsIndex ? [] : {};
      }

      current = current[key];
    }

    // Set the value at the deepest level
    current[keys[keys.length - 1]] = value;
  }


  const executeFunc = (func, targetStruct, targetKey, params) => {
    const propsToBeUpdated = {}

    switch (func) {
      // MARK: dragResize
      case 'dragResize':
        const { coordCol, coordRow, direction, deltaX, deltaY, fixedWidth, fixedHeight} = params;

        if (direction === 'resize-s') {
          const cell = cells.get(targetKey);

          if (fixedHeight) {
            // Check if starting height already captured
            if (params.startingHeightCurrentRow === undefined) {
              // Capture starting heights on first call
              const currentRow = cell.rows[coordRow];
              const rowBelow = cell.rows[coordRow + 1];

              params.startingHeightCurrentRow = parseInt(currentRow.state['base'].height, 10);

              if (rowBelow) {
                params.startingHeightRowBelow = parseInt(rowBelow.state['base'].height, 10);
              }
              else {
                params.startingHeightRowBelow = 0; // Handle no row below
              }
            }

            // Initialize cumulativeDeltaY and previousDeltaY
            if (params.cumulativeDeltaY === undefined) {
              params.cumulativeDeltaY = 0;
              params.previousDeltaY = 0;
            }

            const deltaYInt = parseInt(deltaY, 10);
            const deltaYIncrement = deltaYInt - params.previousDeltaY;
            params.cumulativeDeltaY += deltaYIncrement;
            params.previousDeltaY = deltaYInt;

            const startingHeightCurrentRow = params.startingHeightCurrentRow;
            const startingHeightRowBelow = params.startingHeightRowBelow;

            // Calculate current heights
            let currentHeightCurrentRow = startingHeightCurrentRow + params.cumulativeDeltaY;
            let currentHeightRowBelow = startingHeightRowBelow - params.cumulativeDeltaY;

            // Adjust cumulativeDeltaY to prevent negative heights
            if (currentHeightCurrentRow < 0) {
              params.cumulativeDeltaY -= currentHeightCurrentRow;
              currentHeightCurrentRow = 0;
              currentHeightRowBelow = startingHeightRowBelow - params.cumulativeDeltaY;
            }

            if (currentHeightRowBelow < 0) {
              params.cumulativeDeltaY += currentHeightRowBelow;
              currentHeightRowBelow = 0;
              currentHeightCurrentRow = startingHeightCurrentRow + params.cumulativeDeltaY;
            }

            // Update PropsToBeUpdated
            const propCurrentRow = `rows[${coordRow}].state['base'].height`;
            propsToBeUpdated[propCurrentRow] = currentHeightCurrentRow;

            if (cell.rows[coordRow + 1]) {
              const propRowBelow = `rows[${coordRow + 1}].state['base'].height`;
              propsToBeUpdated[propRowBelow] = currentHeightRowBelow;
            }
            else {
              // fixedHeight is false, only adjust the current row's height
              if (params.startingHeightCurrentRow === undefined) {
                const currentRow = cell.rows[coordRow];
                params.startingHeightCurrentRow = parseInt(currentRow.state['base'].height, 10);
              }

              const startingHeightCurrentRow = params.startingHeightCurrentRow;

              let valueY = startingHeightCurrentRow + parseInt(deltaY, 10);
              valueY = Math.max(valueY, 0); // Prevent negative height

              const propCurrentRow = `rows[${coordRow}].state['base'].height`;
              propsToBeUpdated[propCurrentRow] = valueY;
            }
          }
        }

        if (direction === 'resize-w') {
          const cell = cells.get(targetKey);
        
          if (fixedWidth) {
            // Check if starting width already captured
            if (params.startingWidthCurrentCol === undefined) {
              // Capture starting widths on the first call
              const currentCol = cell.columns[coordCol];
              const colNext = cell.columns[coordCol + 1];
        
              params.startingWidthCurrentCol = parseInt(currentCol.width, 10);
        
              if (colNext) {
                params.startingWidthColNext = parseInt(colNext.width, 10);
              } else {
                params.startingWidthColNext = 0; // Handle no column next
              }
            }
        
            // Initialize cumulativeDeltaX and previousDeltaX
            if (params.cumulativeDeltaX === undefined) {
              params.cumulativeDeltaX = 0;
              params.previousDeltaX = 0;
            }
        
            const deltaXInt = parseInt(deltaX, 10);
            const deltaXIncrement = deltaXInt - params.previousDeltaX;
            params.cumulativeDeltaX += deltaXIncrement;
            params.previousDeltaX = deltaXInt;
        
            const startingWidthCurrentCol = params.startingWidthCurrentCol;
            const startingWidthColNext = params.startingWidthColNext;
        
            // Calculate current widths
            let currentWidthCurrentCol = startingWidthCurrentCol + params.cumulativeDeltaX;
            let currentWidthColNext = startingWidthColNext - params.cumulativeDeltaX;
        
            // Adjust cumulativeDeltaX to prevent negative widths
            if (currentWidthCurrentCol < 0) {
              params.cumulativeDeltaX -= currentWidthCurrentCol;
              currentWidthCurrentCol = 0;
              currentWidthColNext = startingWidthColNext - params.cumulativeDeltaX;
            }
        
            if (currentWidthColNext < 0) {
              params.cumulativeDeltaX += currentWidthColNext;
              currentWidthColNext = 0;
              currentWidthCurrentCol = startingWidthCurrentCol + params.cumulativeDeltaX;
            }
        
            // Update propsToBeUpdated
            const propCurrentCol = `columns[${coordCol}].width`;
            propsToBeUpdated[propCurrentCol] = currentWidthCurrentCol;
        
            if (cell.columns[coordCol + 1]) {
              const propColNext = `columns[${coordCol + 1}].width`;
              propsToBeUpdated[propColNext] = currentWidthColNext;
            }
          } else {
            // fixedWidth is false, only adjust the current column's width
            if (params.startingWidthCurrentCol === undefined) {
              const currentCol = cell.columns[coordCol];
              params.startingWidthCurrentCol = parseInt(currentCol.width, 10);
            }
        
            const startingWidthCurrentCol = params.startingWidthCurrentCol;
        
            let valueX = startingWidthCurrentCol + parseInt(deltaX, 10);
            valueX = Math.max(valueX, 0); // Prevent negative width
        
            const propCurrentCol = `columns[${coordCol}].width`;
            propsToBeUpdated[propCurrentCol] = valueX;
          }
        }
        
        
        
        // if (params.direction === 'resize-w') {
        //   let propX = `columns[${params.coordCol}].width`;
        //   let valueX = parseInt(params.targetPropXStartValue, 10) + parseInt(params.deltaX, 10);
        //   propsToBeUpdated[propX] = valueX;

        //   // If fixedWidth is true, update the width of the column to the right
        //   if (params.fixedWidth) {
        //     propX = `columns[${params.coordCol+1}].width`;
        //     valueX = parseInt(params.targetPropXStartValue, 10) - parseInt(params.deltaX, 10);
        //     propsToBeUpdated[propX] = valueX;
        //   }
        // }
        // else if (params.direction === 'resize-e' && params.coordCol > 0) {
        //   // Reduce width of column immediately to the right
        //   let propX = `columns[${params.coordCol-1}].width`;
        //   let valueX = parseInt(params.targetPropXStartValue, 10) + parseInt(params.deltaX, 10);
        //   propsToBeUpdated[propX] = valueX;

        //   // Increase width of current column
        //   propX = `columns[${params.coordCol}].width`;
        //   valueX = parseInt(params.targetPropXStartValue, 10) - parseInt(params.deltaX, 10);
        //   propsToBeUpdated[propX] = valueX;
        // }
        // else if (params.direction === 'resize-n' && params.coordRow > 0) {
        //   // Reduce height of row immediately above
        //   let propY = `rows[${params.coordRow-1}].state['base'].height`;
        //   let valueY = parseInt(params.targetPropYStartValue, 10) + parseInt(params.deltaY, 10);
        //   propsToBeUpdated[propY] = valueY;

        //   // Increase height of current row
        //   propY = `rows[${params.coordRow}].state['base'].height`;
        //   valueY = parseInt(params.targetPropYStartValue, 10) - parseInt(params.deltaY, 10);
        //   propsToBeUpdated[propY] = valueY;
        // }
        // else if (params.direction === 'resize-s') {
        //   if (params.fixedHeight) {
        //     const cell = cells.get(targetKey);

        //     // Ensure the row below exists
        //     if (cell.rows[params.coordRow + 1]) {
        //       const startingHeightCurrentRow = parseInt(params.targetPropYStartValue, 10);
        //       const startingHeightRowBelow = parseInt(cell.rows[params.coordRow + 1].state['base'].height, 10);

        //       let deltaY = parseInt(params.deltaY, 10);

        //       // Adjust deltaY to prevent negative heights
        //       deltaY = Math.max(deltaY, -startingHeightCurrentRow);
        //       deltaY = Math.min(deltaY, startingHeightRowBelow);

        //       const newHeightCurrentRow = startingHeightCurrentRow + deltaY;
        //       const newHeightRowBelow = startingHeightRowBelow - deltaY;
        //       console.log('deltaY: ', deltaY, 'newHeightCurrentRow: ', newHeightCurrentRow, 'newHeightRowBelow: ', newHeightRowBelow, 'startingHeightCurrentRow: ', startingHeightCurrentRow , 'startingHeightRowBelow: ', startingHeightRowBelow);

        //       let propY = `rows[${params.coordRow}].state['base'].height`;
        //       propsToBeUpdated[propY] = newHeightCurrentRow;

        //       propY = `rows[${params.coordRow + 1}].state['base'].height`;
        //       propsToBeUpdated[propY] = newHeightRowBelow;
        //     }
        //   }
        //   else {
        //     // fixedHeight is false
        //     let propY = `rows[${params.coordRow}].state['base'].height`;
        //     let valueY = parseInt(params.targetPropYStartValue, 10) + parseInt(params.deltaY, 10);
        //     valueY = Math.max(valueY, 0); // Prevent negative heights
        //     propsToBeUpdated[propY] = valueY;
        //   }
        // }

        return propsToBeUpdated;
        
      case 'moveCursor':
        const cell = cells.get(targetKey);
        
        let cellProps = {
          processedCells: new Set(),
          colCount: cell.colCount,
          rowCount: cell.rowCount,
          cursorCol: cell.cursorCol,
          cursorRow: cell.cursorRow,
          cursorColSpan: cell.cursorColSpan,
          cursorRowSpan: cell.cursorRowSpan,
          mergedColContext: cell.mergedColContext,
          mergedRowContext: cell.mergedRowContext,
          selectionCol: cell.selectionCol,
          selectionRow: cell.selectionRow,
          selectionColSpan: cell.selectionColSpan,
          selectionRowSpan: cell.selectionRowSpan,
          selectionColStepDirection: cell.selectionColStepDirection,
          selectionRowStepDirection: cell.selectionRowStepDirection,
        }

        if (params.direction === 'click') {
          cellProps.cursorCol = params.coordCol;
          cellProps.cursorRow = params.coordRow;     
          cellProps.cursorColSpan = cell.rows[cellProps.cursorRow].cells[cellProps.cursorCol].colSpan;
          cellProps.cursorRowSpan = cell.rows[cellProps.cursorRow].cells[cellProps.cursorCol].rowSpan;   

          cellProps.mergedColContext = null;
          cellProps.selectionCol = params.coordCol;
          cellProps.selectionRow = params.coordRow;
          cellProps.selectionColSpan = cell.rows[cellProps.cursorRow].cells[cellProps.cursorCol].colSpan;
          cellProps.selectionRowSpan = cell.rows[cellProps.cursorRow].cells[cellProps.cursorCol].rowSpan;
          cellProps.selectionColStepDirection = null;
          cellProps.selectionRowStepDirection = null;
        }
        if (params.direction === 'clickShift') {
          
          // User shift clicks above - selection box spans from the clicked row to the cursor row
          if (params.coordRow < cellProps.cursorRow) {
            cellProps.selectionRow = params.coordRow;
            cellProps.selectionRowSpan = cellProps.cursorRow - params.coordRow + 1;
          }
          // User shift clicks below - selection box spans from the cursor row to the clicked row
          else {
            cellProps.selectionRow = cellProps.cursorRow;
            cellProps.selectionRowSpan = params.coordRow - parseInt(cellProps.cursorRow, 10) + 1;
          }
          // User shift clicks to the left - selection box expands from the clicked col to cursor col
          if (params.coordCol < cellProps.cursorCol) {
            cellProps.selectionCol = params.coordCol;
            cellProps.selectionColSpan = cellProps.cursorCol - params.coordCol + 1;
          }
          else {
            cellProps.selectionCol = cellProps.cursorCol;
            cellProps.selectionColSpan = params.coordCol - parseInt(cellProps.cursorCol, 10) + 1;
          }

          let mergeCheckComplete = { value: false };
          let processedCells = new Set();

          let coords = {
            topLeftRow: cellProps.selectionRow,
            topLeftCol: cellProps.selectionCol,
            bottomRightRow: cellProps.selectionRow + cellProps.selectionRowSpan - 1,
            bottomRightCol: cellProps.selectionCol + cellProps.selectionColSpan - 1,
          }

          while (!mergeCheckComplete.value) {
            loopThruCells(cell, processedCells, coords, mergeCheckComplete);
          }

          // Convert the updated selection box coords to a new selection span
          cellProps.selectionCol = coords.topLeftCol;
          cellProps.selectionRow = coords.topLeftRow;
          cellProps.selectionColSpan = coords.bottomRightCol - coords.topLeftCol + 1;
          cellProps.selectionRowSpan = coords.bottomRightRow - coords.topLeftRow + 1;

          cellProps.mergedColContext = null;
          cellProps.selectionColStepDirection = null;
          cellProps.selectionRowStepDirection = null;
        }
        if (['ArrowLeft', 'ArrowRight'].includes(params.direction)) {
          // Reset the merged col context as it's only applicable when moving vertically
          cellProps.mergedColContext = null;

          // Look ahead to next destination cell - check if there's room to move
          const nextCellRow = cellProps.mergedRowContext ?? cellProps.cursorRow;
          const currentColSpan = cell.rows[cellProps.cursorRow].cells[cellProps.cursorCol].colSpan;

          let nextCellCol = cellProps.cursorCol;
          if (params.direction === 'ArrowLeft' && cellProps.cursorCol > 0) {
            nextCellCol = cellProps.cursorCol - 1;
          }
          else if (params.direction === 'ArrowRight' && cellProps.cursorCol < cellProps.colCount - currentColSpan) {
            nextCellCol = cellProps.cursorCol + currentColSpan;
          }

          const nextCell = cell.rows[nextCellRow]?.cells[nextCellCol];
          
          // If next cell is merged, move to upper left anchor cell of merged range and apply its span
          if (nextCell.merged) {
            cellProps.cursorRow = nextCell.anchorRow;
            cellProps.cursorCol = nextCell.anchorCol;
            cellProps.cursorRowSpan = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol].rowSpan;
            cellProps.cursorColSpan = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol].colSpan;
            cellProps.selectionRow = nextCell.anchorRow;
            cellProps.selectionCol = nextCell.anchorCol;
            cellProps.selectionRowSpan = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol].rowSpan;
            cellProps.selectionColSpan = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol].colSpan;

            // If row position will change in move to anchor cell location, store the prev row position context in order to be able to return to it
            if (cellProps.cursorRow !== cell.cursorRow) {
              cellProps.mergedRowContext = cell.cursorRow;
            }
          }
          else {
            // If not merged, move left or right
            cellProps.cursorCol = nextCellCol;
            cellProps.selectionCol = cellProps.cursorCol;
            cellProps.selectionRow = cellProps.cursorRow;
            cellProps.cursorColSpan = nextCell.colSpan;
            cellProps.cursorRowSpan = nextCell.rowSpan;
            cellProps.selectionRowSpan = nextCell.rowSpan;
            cellProps.selectionColSpan = nextCell.colSpan;
            // clear selection step direction
            cellProps.selectionColStepDirection = null;
            cellProps.selectionRowStepDirection = null;


            // If moving out of a merged cell, return to the original row position
            if (cellProps.mergedRowContext !== null) {
              cellProps.cursorRow = cellProps.mergedRowContext;
              cellProps.selectionRow = cellProps.cursorRow;
              cellProps.mergedRowContext = null;
            }
          }

          // Re-align selection to cursor position
          cellProps.selectionCol = cellProps.cursorCol;
          cellProps.selectionRow = cellProps.cursorRow;
          cellProps.selectionColStepDirection = null;
          cellProps.selectionRowStepDirection = null;
        }
        if (['ArrowUp', 'ArrowDown'].includes(params.direction)) {

          // Reset the merged row context as it's only applicable when moving horizontally
          cellProps.mergedRowContext = null;

          // Look ahead to next destination cell - check if there's room to move
          const nextCellCol = cellProps.mergedColContext ?? cellProps.cursorCol;
          const currentRowSpan = cell.rows[cellProps.cursorRow].cells[cellProps.cursorCol].rowSpan;

          let nextCellRow = cellProps.cursorRow;
          if (params.direction === 'ArrowUp' && cellProps.cursorRow > 0) {
            nextCellRow = cellProps.cursorRow - 1;
          }
          else if (params.direction === 'ArrowDown' && cellProps.cursorRow < cellProps.rowCount - currentRowSpan) {
            nextCellRow = cellProps.cursorRow + currentRowSpan;
          }

          const nextCell = cell.rows[nextCellRow]?.cells[nextCellCol];

          // If next cell is merged, move to upper left anchor cell of merged range and apply its span
          if (nextCell.merged) {
            cellProps.cursorRow = nextCell.anchorRow;
            cellProps.cursorCol = nextCell.anchorCol;
            cellProps.cursorRowSpan = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol].rowSpan;
            cellProps.cursorColSpan = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol].colSpan;
            cellProps.selectionRow = nextCell.anchorRow;
            cellProps.selectionCol = nextCell.anchorCol;
            cellProps.selectionRowSpan = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol].rowSpan;
            cellProps.selectionColSpan = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol].colSpan;

            // If col position will change in move to anchor cell location, store the prev col position context in order to be able to return to it
            if (cellProps.cursorCol !== cell.cursorCol) {
              cellProps.mergedColContext = cell.cursorCol;
            }
          }
          else {
            // If not merged, move up or down
            cellProps.cursorRow = nextCellRow;
            cellProps.selectionRow = cellProps.cursorRow;
            cellProps.selectionCol = cellProps.cursorCol;
            cellProps.cursorRowSpan = nextCell.rowSpan;
            cellProps.cursorColSpan = nextCell.colSpan;
            cellProps.selectionRowSpan = nextCell.rowSpan;
            cellProps.selectionColSpan = nextCell.colSpan;
            // clear selection step direction
            cellProps.selectionColStepDirection = null;
            cellProps.selectionRowStepDirection = null;

            // If moving out of a merged cell, return to the original col position
            if (cellProps.mergedColContext !== null) {
              cellProps.cursorCol = cellProps.mergedColContext;
              cellProps.selectionCol = cellProps.cursorCol;
              cellProps.mergedColContext = null;
            }
          }

          // Re-align selection to cursor position
          cellProps.selectionCol = cellProps.cursorCol;
          cellProps.selectionRow = cellProps.cursorRow;
          cellProps.selectionColStepDirection = null;
          cellProps.selectionRowStepDirection = null;
        }
        if (['ArrowLeftShift', 'ArrowRightShift'].includes(params.direction)) {
          let mergeCheckComplete = { value: false };
          let processedCells = new Set();

          let coords = {
            topLeftRow: cellProps.selectionRow,
            topLeftCol: cellProps.selectionCol,
            bottomRightRow: cellProps.selectionRow + cellProps.selectionRowSpan - 1,
            bottomRightCol: cellProps.selectionCol + cellProps.selectionColSpan - 1,
          }

          const continuedRightExpansion = cellProps.selectionColStepDirection === 'ArrowRightShift' || ['ArrowUpShift', 'ArrowDownShift'].includes(cellProps.selectionRowStepDirection);
          const continuedLeftExpansion = cellProps.selectionColStepDirection === 'ArrowLeftShift' || ['ArrowUpShift', 'ArrowDownShift'].includes(cellProps.selectionRowStepDirection);

          // CONTINUED EXPANSION: allow continued expansion if user has already expanded the selection box in a direction
          if ( (params.direction === 'ArrowRightShift' && continuedRightExpansion && cellProps.selectionColStepDirection !== 'ArrowLeftShift' && coords.topLeftCol < cellProps.cursorCol && coords.bottomRightCol < cellProps.colCount - 1) ||
             (params.direction === 'ArrowLeftShift' && continuedLeftExpansion && cellProps.selectionColStepDirection !== 'ArrowRightShift' && coords.topLeftCol > 0) ) {
            
            let nextCellCol = params.direction === 'ArrowLeftShift' ? coords.topLeftCol - 1 : coords.bottomRightCol + 1;

            // Check initial cell for merge
            checkForMerge(cellProps.selectionRow, nextCellCol, cell, processedCells, coords);

            // Continue to re-trigger 'for' loop with new range coords if new merges are identified
            while (!mergeCheckComplete.value) {
              loopThruCells(cell, processedCells, coords, mergeCheckComplete);
            }

            cellProps.selectionColStepDirection = params.direction;
          }
          // CONTRACTION: if selection box has already been extended beyond cursor cell, then CONTRACT that side if user presses opposite direction
          else if ( (params.direction === 'ArrowLeftShift' && coords.bottomRightCol > cellProps.cursorCol + cell.rows[cellProps.cursorRow].cells[cellProps.cursorCol].colSpan - 1 && cellProps.selectionColStepDirection !== 'ArrowLeftShift') ||
               (params.direction === 'ArrowRightShift' && coords.topLeftCol < cellProps.cursorCol && cellProps.selectionColStepDirection !== 'ArrowRightShift') ) {

            let nextCellCol = params.direction === 'ArrowLeftShift' ? coords.bottomRightCol - 1: coords.topLeftCol + 1;
            let unmergedCol = false;

            while (!unmergedCol) {
              // prevent check from exceeding boundaries
              if (nextCellCol < 0 || nextCellCol > cellProps.colCount - 1) break;

              unmergedCol = true; // Assume col of focus is unmerged

              // Loop thru all cells in the column of focus to confirm if any are merged and prevent movement
              for (let i = coords.topLeftRow; i <= coords.bottomRightRow; i++) {
                const nextCell = cell.rows[i].cells[nextCellCol];
                const nextCellAnchorCell = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol];

                // Check various conditions for merge
                // Condition #1: cell has 'merged' prop, and that cell's anchorCell extends beyond the column of focus
                // Condition #2: cell is anchorCell in a merge, which extends beyond the column of focus
                if ( (params.direction === 'ArrowLeftShift' && nextCell.merged && nextCell.anchorCol + nextCellAnchorCell.colSpan - 1 > nextCellCol) ||
                     (params.direction === 'ArrowLeftShift' && nextCell.colSpan > 1 && nextCellCol + nextCell.colSpan - 1 > nextCellCol) ||
                     (params.direction === 'ArrowRightShift' && nextCell.merged && nextCell.anchorCol < nextCellCol) ) {

                  unmergedCol = false;
                  break;
                }
              }

              // If merge is found, move to the next column
              if (!unmergedCol) {
                if (params.direction === 'ArrowLeftShift') {
                  nextCellCol--;
                }
                else if (params.direction === 'ArrowRightShift') {
                  nextCellCol++;
                }
              }

              // Otherwise, if Unmerged column is found, update the selection box coords
              if (unmergedCol) {
                if (params.direction === 'ArrowLeftShift') {
                  coords.bottomRightCol = nextCellCol;
                }
                else if (params.direction === 'ArrowRightShift') {
                  coords.topLeftCol = nextCellCol;
                }
              }
            }
          }
          // EXPANSION: else if there's room to move, expand the selection box in the direction of the cursor
          else if ( (params.direction === 'ArrowLeftShift' && coords.topLeftCol > 0) ||
                    (params.direction === 'ArrowRightShift' && coords.bottomRightCol < cellProps.colCount - 1) ) {
            
            let nextCellCol = params.direction === 'ArrowLeftShift' ? coords.topLeftCol - 1 : coords.bottomRightCol + 1;

            // Check initial cell for merge
            checkForMerge(cellProps.selectionRow, nextCellCol, cell, processedCells, coords);

            // Continue to re-trigger 'for' loop with new range coords if new merges are identified
            while (!mergeCheckComplete.value) {
              loopThruCells(cell, processedCells, coords, mergeCheckComplete);
            }

            cellProps.selectionColStepDirection = params.direction;
          }

          // Convert the updated selection box coords to a new selection span
          cellProps.selectionCol = coords.topLeftCol;
          cellProps.selectionRow = coords.topLeftRow;
          cellProps.selectionColSpan = coords.bottomRightCol - coords.topLeftCol + 1;
          cellProps.selectionRowSpan = coords.bottomRightRow - coords.topLeftRow + 1;
        }
        if (['ArrowUpShift', 'ArrowDownShift'].includes(params.direction)) {
          let mergeCheckComplete = { value: false };
          let processedCells = new Set();
        
          let coords = {
            topLeftRow: cellProps.selectionRow,
            topLeftCol: cellProps.selectionCol,
            bottomRightRow: cellProps.selectionRow + cellProps.selectionRowSpan - 1,
            bottomRightCol: cellProps.selectionCol + cellProps.selectionColSpan - 1,
          }

          const continuedDownExpansion = cellProps.selectionRowStepDirection === 'ArrowDownShift' || ['ArrowLeftShift', 'ArrowRightShift'].includes(cellProps.selectionColStepDirection);
          const continuedUpExpansion = cellProps.selectionRowStepDirection === 'ArrowUpShift' || ['ArrowLeftShift', 'ArrowRightShift'].includes(cellProps.selectionColStepDirection);
        
          // CONTINUED EXPANSION: allow continued expansion if user has already expanded the selection box in a direction
          if ((params.direction === 'ArrowDownShift' && continuedDownExpansion && coords.bottomRightRow < cellProps.rowCount - 1) ||
              (params.direction === 'ArrowUpShift' && continuedUpExpansion && coords.topLeftRow > 0)) {
                let nextCellRow = params.direction === 'ArrowUpShift' ? coords.topLeftRow - 1 : coords.bottomRightRow + 1;
        
                // Check the initial cell for merge
                checkForMerge(nextCellRow, cellProps.selectionCol, cell, processedCells, coords);
            
                // Continue to re-trigger 'for' loop with new range coords if new merges are identified
                while (!mergeCheckComplete.value) {
                  loopThruCells(cell, processedCells, coords, mergeCheckComplete);
                }

                cellProps.selectionRowStepDirection = params.direction;
              }
          // CONTRACTION: if the selection box has already been extended beyond the cursor cell, CONTRACT if the user presses in the opposite direction
          else if ((params.direction === 'ArrowUpShift' && coords.bottomRightRow > cellProps.cursorRow + cell.rows[cellProps.cursorRow].cells[cellProps.cursorCol].rowSpan - 1 && cellProps.selectionRowStepDirection !== 'ArrowUpShift') ||
                   (params.direction === 'ArrowDownShift' && coords.topLeftRow < cellProps.cursorRow && cellProps.selectionRowStepDirection !== 'ArrowDownShift')) {
        
            let nextCellRow = params.direction === 'ArrowUpShift' ? coords.bottomRightRow - 1 : coords.topLeftRow + 1;
            let unmergedRow = false;
        
            while (!unmergedRow) {
              // Prevent the check from exceeding boundaries
              if (nextCellRow < 0 || nextCellRow > cellProps.rowCount - 1) break;
        
              unmergedRow = true; // Assume the row of focus is unmerged
        
              // Loop through all cells in the row of focus to confirm if any are merged and prevent movement
              for (let i = coords.topLeftCol; i <= coords.bottomRightCol; i++) {
                const nextCell = cell.rows[nextCellRow].cells[i];
                const nextCellAnchorCell = cell.rows[nextCell.anchorRow]?.cells[nextCell.anchorCol];
        
                // Check various conditions for merge
                // Condition #1: cell has 'merged' prop, and that cell's anchorCell extends beyond the row of focus
                // Condition #2: cell is anchorCell in a merge, which extends beyond the row of focus
                if ((params.direction === 'ArrowUpShift' && nextCell.merged && nextCell.anchorRow + nextCellAnchorCell.rowSpan - 1 > nextCellRow) ||
                    (params.direction === 'ArrowUpShift' && nextCell.rowSpan > 1 && nextCellRow + nextCell.rowSpan - 1 > nextCellRow) ||
                    (params.direction === 'ArrowDownShift' && nextCell.merged && nextCell.anchorRow < nextCellRow)) {
        
                  unmergedRow = false;
                  break;
                }
              }
        
              // If a merge is found, move to the next row
              if (!unmergedRow) {
                if (params.direction === 'ArrowUpShift') {
                  nextCellRow--;
                } else if (params.direction === 'ArrowDownShift') {
                  nextCellRow++;
                }
              }
        
              // Otherwise, if an unmerged row is found, update the selection box coords
              if (unmergedRow) {
                if (params.direction === 'ArrowUpShift') {
                  coords.bottomRightRow = nextCellRow;
                } else if (params.direction === 'ArrowDownShift') {
                  coords.topLeftRow = nextCellRow;
                }
              }
            }
          }
          // EXPANSION: else if there's room to move, expand the selection box in the direction of the cursor
          else if ((params.direction === 'ArrowUpShift' && coords.topLeftRow > 0) ||
                   (params.direction === 'ArrowDownShift' && coords.bottomRightRow < cellProps.rowCount - 1)) {
        
            let nextCellRow = params.direction === 'ArrowUpShift' ? coords.topLeftRow - 1 : coords.bottomRightRow + 1;
        
            // Check the initial cell for merge
            checkForMerge(nextCellRow, cellProps.selectionCol, cell, processedCells, coords);
        
            // Continue to re-trigger 'for' loop with new range coords if new merges are identified
            while (!mergeCheckComplete.value) {
              loopThruCells(cell, processedCells, coords, mergeCheckComplete);
            }

            cellProps.selectionRowStepDirection = params.direction;
          }
        
          // Convert the updated selection box coords to a new selection span
          cellProps.selectionCol = coords.topLeftCol;
          cellProps.selectionRow = coords.topLeftRow;
          cellProps.selectionColSpan = coords.bottomRightCol - coords.topLeftCol + 1;
          cellProps.selectionRowSpan = coords.bottomRightRow - coords.topLeftRow + 1;
        }



        // Return movecursor's updated cursor and selection positions
        Object.assign(propsToBeUpdated, {
          cursorCol: cellProps.cursorCol, 
          cursorRow: cellProps.cursorRow, 
          cursorColSpan: cellProps.cursorColSpan,
          cursorRowSpan: cellProps.cursorRowSpan,
          selectionCol: cellProps.selectionCol,
          selectionRow: cellProps.selectionRow,
          selectionColSpan: cellProps.selectionColSpan,
          selectionRowSpan: cellProps.selectionRowSpan,
          mergedColContext: cellProps.mergedColContext,
          mergedRowContext: cellProps.mergedRowContext,
          selectionColStepDirection: cellProps.selectionColStepDirection,
          selectionRowStepDirection: cellProps.selectionRowStepDirection,
        });

        return propsToBeUpdated;


      default:
        return null;
    }
  }


  const convertCellRefToCoords = (cellRef) => {
    const match = cellRef.match(/^([A-Za-z]*)([0-9]*)$/);
    const columnLetters = match[1].toUpperCase();
    const rowNumber = match[2] ? parseInt(match[2], 10) - 1 : null;

    // Convert col letters to index
    let colIndex = null;
    if (columnLetters) {
      colIndex = 0;
      for (let i = 0; i < columnLetters.length; i++) {
        colIndex *= 26;
        colIndex += columnLetters.charCodeAt(i) - 65 + 1;
      }
      colIndex -= 1;
    }

    return { rowIndex: rowNumber, colIndex };
  }


  const convertCoordsToCellRef = ({ rowIndex, colIndex }) => {
    let columnLetters = '';
    let colNum = colIndex + 1;
    while (colNum > 0) {
      const modulo = (colNum - 1) % 26;
      columnLetters = String.fromCharCode(65 + modulo) + columnLetters;
      colNum = Math.floor((colNum - modulo) / 26);
    }

    const cellRef = `${columnLetters}${rowIndex + 1}`;
    return cellRef;
  }


  const getRowCellObj = (cellRef, parentStruct, parentKey) => {
    const { rowIndex, colIndex } = convertCellRefToCoords(cellRef);

    // Access the cell from the struct
    const table = cells.get(parentKey);
    if (!table) {
      throw new Error('Table not found');
    }

    const rows = table.rows;

    const row = rows[rowIndex];
    const rowCellObj = row.cells[colIndex];

    return rowCellObj;
  }


  const generateCellReferencesInRange = (startCellRef, endCellRef, parentStruct, parentKey) => {
    const startIndicies = convertCellRefToCoords(startCellRef);
    const endIndicies = convertCellRefToCoords(endCellRef);
    const cell = cells.get(parentKey);
    const totalRows = cell.rows.length;
    const totalCols = cell.rows[0].cells.length;

    const startRow = startIndicies.rowIndex !== null ? startIndicies.rowIndex : 0;
    const endRow = endIndicies.rowIndex !== null ? endIndicies.rowIndex : totalRows - 1;

    const startCol = startIndicies.colIndex !== null ? startIndicies.colIndex : 0;
    const endCol = endIndicies.colIndex !== null ? endIndicies.colIndex : totalCols - 1;
    
    const cellRefs = [];

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
        const cellRef = convertCoordsToCellRef({ rowIndex, colIndex });
        cellRefs.push(cellRef);
      }
    }

    return cellRefs;
  }


  const extractCellReference = (ast) => {
    switch (ast.type) {
      case 'MemberExpression':
        // The object should be a cell reference
        if (ast.object.type === 'CellReference') {
          return ast.object.name;
        }
        else {
          // If nested, recursively extract
          return extractCellReference(ast.object);
        }
      case 'CellReference':
        return ast.name;
      case 'Identifier':
        return ast.name;
      default:
        throw new Error('extractCellReference: Invalid AST node for cell reference. ${ast.type}');
    }
  }


  const getRangeValues = (rangeLeft, rangeRight, propIdentifier, parentStruct, parentKey) => {
    // Generate cell references in the range
    const cellRefs = propIdentifier ? generateCellReferencesInRange(rangeLeft, rangeRight, parentStruct, parentKey) : generateReferencesInRange(rangeLeft, rangeRight, parentStruct, parentKey);

    // Retrieve values from cells
    const values = cellRefs.map(cellRef => {
      const cellObject = getRowCellObj(cellRef, parentStruct, parentKey);
      return extractValue(cellObject, propIdentifier);
    });
    
    return values;
  }


  const extractValue = (cellObject, propIdentifier) => {
    if (cellObject && typeof cellObject === 'object' && cellObject.hasOwnProperty('value')) {
      let value = cellObject[propIdentifier];
  
      // Attempt to parse numeric strings as numbers
      if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          return num;
        }
      }
  
      return value;
    }
  
    return null; // or throw an error if appropriate
  };

  const parseReferenceString = (referenceString) => {
    // Remove the surrounding brackets if necessary
    let ref = referenceString.trim();
    if (ref.startsWith('[') && ref.endsWith(']')) {
      ref = ref.slice(1, -1);
    }

    // Split the reference into parts
    const parts = ref.split('][').map(part => part.trim());

    // Further split parts with dot notation and array indices
    const parsedParts = parts.map(part => {
      // Match identifiers, indices, and properties
      const tokens = [];
      let buffer = '';
      for (let i = 0; i < part.length; i++) {
        const char = part[i];
        if (char === '.' || char === '[' || char === ']') {
          if (buffer) {
            tokens.push(buffer);
            buffer = '';
          }
          if (char === '[') {
            // Collect index
            let index = '';
            i++; // Skip '['
            while (part[i] !== ']' && i < part.length) {
              index += part[i];
              i++;
            }
            tokens.push(index);
          }
        }
        else {
          buffer += char;
        }
      }
      if (buffer) {
        tokens.push(buffer);
      }
      return tokens;
    });

    // Flatten the parsed parts
    return parsedParts.flat();
  };


  const identifyVariableIndices = (leftParts, rightParts) => {
    const variableIndices = [];
    const fixedParts = [];

    for (let i = 0; i < leftParts.length; i++) {
      const leftPart = leftParts[i];
      const rightPart = rightParts[i];

      if (leftPart === rightPart) {
        fixedParts.push(leftPart);
      }
      else if (/^\d+$/.test(leftPart) && /^\d+$/.test(rightPart)) {
        // Both are numeric indices
        variableIndices.push({
          index: i,
          start: parseInt(leftPart, 10),
          end: parseInt(rightPart, 10),
        });
      }
      else {
        throw new Error(`Cannot generate range between non-matching references at part index ${i}`);
      }
    }

    return { variableIndices, fixedParts };
  };


  const generateReferencesInRange = (fixedParts, variableIndices) => {
    const refs = [];

    const generateRefsRecursive = (currentParts, index) => {
      if (index >= variableIndices.length) {
        refs.push([...currentParts]);
        return;
      }

      const { index: partIndex, start, end } = variableIndices[index];
      for (let i = start; i <= end; i++) {
        currentParts[partIndex] = i.toString();
        generateRefsRecursive(currentParts, index + 1);
      }
    };

    // Initialize currentParts with fixed parts and placeholders for variable parts
    const currentParts = [...fixedParts];
    variableIndices.forEach(({ index }) => {
      currentParts[index] = null; // Placeholder
    });

    generateRefsRecursive(currentParts, 0);

    return refs;
  };


  // const evaluateReferences = (references, propIdentifier) => {
  //   return references.map(parts => {
  //     const value = resolveReference(parts);

  //     if (propIdentifier && typeof value === 'object' && value.hasOwnProperty(propIdentifier)) {
  //       return value[propIdentifier];
  //     }

  //     return value;
  //   });
  // };
  
  // const resolveReference = (parts) => {
  //   let current = stateMappingRef; // Replace with your root data structure

  //   console.log('resolveReference.  current: ', current, 'parts: ', parts);

  //   for (let part of parts) {
  //     if (Array.isArray(current)) {
  //       // Numeric index into an array
  //       const index = parseInt(part, 10);
  //       if (isNaN(index) || index < 0 || index >= current.length) {
  //         throw new Error(`Invalid array index: ${part}`);
  //       }
  //       current = current[index];
  //     }
  //     else if (typeof current === 'object' && current !== null && current.hasOwnProperty(part)) {
  //       current = current[part];
  //     }
  //     else {
  //       throw new Error(`Property ${part} not found in object`);
  //     }
  //   }

  //   return current;
  // }


  const extractReferenceString = (astNode) => {
    if (astNode.type === 'Reference') {
      return astNode.value;
    }
    else {
      throw new Error('expected a Reference node');
    }
  }

  const generateReferencesBetween = (leftRef, rightRef) => {
    // Parse references
    const leftParsed = parseReference(leftRef);
    const rightParsed = parseReference(rightRef);

    // Ensure that 'struct' and 'key' are the same
    if (leftParsed.struct !== rightParsed.struct || leftParsed.key !== rightParsed.key) {
      throw new Error('References must be in the same struct');
    }

    // Identify variable indices in 'props'
    const variableIndices = [];
    const fixedProps = [];

    for (let i = 0; i < leftParsed.props.length; i++) {
      const leftProp = leftParsed.props[i];
      const rightProp = rightParsed.props[i];

      if (leftProp === rightProp) {
        fixedProps.push(leftProp);
      }
      else if (/^\d+$/.test(leftProp) && /^\d+$/.test(rightProp)) {
        // Both are numeric indices
        variableIndices.push({
          index: i,
          start: parseInt(leftProp, 10),
          end: parseInt(rightProp, 10),
        });
        fixedProps.push(null); // Placeholder for variable index
      }
      else {
        throw new Error(`Cannot generate range between non-matching references at prop index ${i}`);
      }
    }

    // Generate all combinations of variable indices
    const references = generateReferencesRecursive(leftParsed.struct, leftParsed.key, fixedProps, variableIndices, 0);

    return references;
  }

  const generateReferencesRecursive = (struct, key, props, variableIndices, index) => {
    if (index >= variableIndices.length) {
      // Base case: no more variable indices
      const ref = constructReferenceString(struct, key, props);
      return [ref];
    }

    const { index: propIndex, start, end } = variableIndices[index];
    const refs = [];

    for (let i = start; i <= end; i++) {
      // Replace the variable index in props
      const newProps = [...props];
      newProps[propIndex] = i.toString();

      // Recurse to handle the next variable index
      const deeperRefs = generateReferencesRecursive(struct, key, newProps, variableIndices, index + 1);
      refs.push(...deeperRefs);
    }

    return refs;
  };


  const constructReferenceString = (struct, key, props) => {
    let ref = `[${struct}][${key}]`;
    for (let prop of props) {
      if (/^\d+$/.test(prop)) {
        ref += `[${prop}]`;
      }
      else {
        ref += `[${prop}]`;
      }
    }
    return ref;
  };


  const evaluateTokens = (ast, parentStruct, parentKey) => {
    switch (ast.type) {
      case 'Literal':
        return ast.value;

      case 'CellReference':
        const rowCellObj = getRowCellObj(ast.name, parentStruct, parentKey);
        return rowCellObj;

      case 'MemberExpression':
        const objectValue = evaluateTokens(ast.object, parentStruct, parentKey);
        if (typeof objectValue === 'object' && ast.property.type === 'Identifier') {
          return objectValue[ast.property.name];
        }
        else {
          throw new Error('Cannot access property ${ast.property.name} of non-object');
        }
        
      case 'Reference':
        const refVal = getReferenceValue(ast.value);
        return refVal;

      case 'RangeExpression':
        if (ast.left.type === 'CellReference' && ast.right.type === 'CellReference') {
          // Handle CellReferences
          const rangeLeft = extractCellReference(ast.left);
          const rangeRight = extractCellReference(ast.right);
          const cellRefPropIdentifier = ast.left.property;
          // Generate array of values from range
          return getRangeValues(rangeLeft, rangeRight, cellRefPropIdentifier, parentStruct, parentKey);
        }
        else if (ast.left.type === 'Reference' && ast.right.type === 'Reference') {
          // Handle complex references
          const leftRefString = extractReferenceString(ast.left);
          const rightRefString = extractReferenceString(ast.right);

          // Generate all references in the range
          const references = generateReferencesBetween(leftRefString, rightRefString);

          // Determine the property identifier if needed
          const propIdentifier = ast.left.property ? ast.left.property.name : null;

          // Evaluate references to get values
          const values = references.map(ref => {
            const value = getReferenceValue(ref);
            // If propIdentiier is provided, extract the property
            if (propIdentifier && typeof value === 'object' && value.hasOwnProperty(propIdentifier)) {
              return value[propIdentifier];
            }
            return value;
          });

          return values;
        }
        else {
          throw new Error('Invalid types in RangeExpression');
        }

      case 'List':
        return ast.value;

      case 'FunctionCall':
        const args = ast.arguments.map(arg => evaluateTokens(arg, parentStruct, parentKey));
        const propsToBeUpdated = {}
        switch(ast.name.toLowerCase()) {
          case 'sum': {
            const flatArgs = args.flat(Infinity); // Flatten nested arrays
            const numbers = flatArgs.map(val => parseFloat(val)).filter(num => !isNaN(num));
            return numbers.reduce((acc, val) => acc + val, 0);
          }
          case 'count': {
            const flatArgs = args.flat(Infinity); // Flatten nested arrays
            return flatArgs.length;
          }
        }
        return null;

      case 'IfExpression':
        const condition = evaluateTokens(ast.condition, parentStruct, parentKey);
        const consequent = evaluateTokens(ast.consequent, parentStruct, parentKey);
        const alternate = evaluateTokens(ast.alternate, parentStruct, parentKey);
        return condition ? consequent : alternate;

      case 'InExpression':
        let listItem = evaluateTokens(ast.item, parentStruct, parentKey);
        let listValues = [];
        ast.list.value.forEach(listValue => {
          listValues.push(evaluateTokens(listValue, parentStruct, parentKey));
        });
        return listValues.includes(listItem);

      case 'NotInExpression':
        let notListItem = evaluateTokens(ast.item, parentStruct, parentKey);
        let notListValues = [];
        ast.list.value.forEach(listValue => {
          notListValues.push(evaluateTokens(listValue, parentStruct, parentKey));
        });
        return !notListValues.includes(notListItem);

      case 'NotNullExpression':
        let notNullItem = evaluateTokens(ast.item, parentStruct, parentKey);
        return notNullItem !== null;

      case 'BinaryExpression':
        const left = evaluateTokens(ast.left, parentStruct, parentKey);
        const right = evaluateTokens(ast.right, parentStruct, parentKey);

        const leftNum = parseFloat(left);
        const rightNum = parseFloat(right);

        switch(ast.operator) {
          case 'and':
            return left && right;
          case 'or':
            return left || right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          case '+':
            if (!isNaN(leftNum) && !isNaN(rightNum)) {
              return leftNum + rightNum;
            }
            else {
              return String(left) + String(right);
            }
          case '-':
            return left - right;
          case '&':
            return String(left) + String(right);
          case '<':
            return left < right;
          case '>':
            return left > right;
          case '<=':
            return left <= right;
          case '>=':
            return left >= right;
          case '!=':
            return left !== right;
          case '=':
            return left === right;
          default:
            throw new Error(`Unrecognized operator: ${ast.operator}`);
        }
      default:
        throw new Error(`Unrecognized AST node type: ${ast.type}`);
    }
    return null;
  };



  /////////////////////////////////////////////////////////////////////////////////////////////
  // API CALLS
  /////////////////////////////////////////////////////////////////////////////////////////////


  // retrieve
  const apiRetrieve = async (db, collection, formula, references) => {
    // call func to parse references and convert to a value


    try {
      const response = await axios.get(`${apiURL}/api/${db}/${collection}/`, {
        params: { formula: formula, references: references }
      })
      return response.data;
    } catch (error) {
      console.error('apiRetrieve error: ', error);
      return null;
    }
  }

  // get Users
  const apiGetUsers = async (userIds) => {
    try {
      const response = await axios.get(`${apiURL}/api/users/`, {
        params: { userIds: userIds }
      })
      return response.data;
    } catch (error) {
      console.error('apiGetUsers error: ', error);
      return null;
    }
  }


  // get Organization
  const apiGetOrganizations = async (organizationIds) => {
    try {
      const response = await axios.get(`${apiURL}/api/organizations/`, {
        params: { organizationIds: organizationIds }
      })
      return response.data;
    } catch (error) {
      console.error('apiGetOrganizations error: ', error);
      return null;
    }
  }


  // get Workspace
  // const apiGetWorkspace = async (workspaceId) => {
  //   const orgDbId = organization._id + '_db';
  //   try {
  //     const response = await axios.get(`${apiURL}/api/${orgDbId}/workspaces/${workspaceId}`)
  //     return response.data;
  //   } catch (error) {
  //     console.error('apiGetWorkspace error: ', error);
  //     return null;
  //   }
  // }

  // get Pages
  // const apiGetPages = async (pageIds) => {
  //   const orgDbId = organization._id + '_db';
  //   try {
  //     const response = await axios.get(`${apiURL}/api/${orgDbId}/pages/`, {
  //       params: { workspaceId: currentWorkspace._id, pageIds: pageIds }
  //     })
  //     return response.data;
  //   } catch (error) {
  //     console.error('apiGetPage error: ', error);
  //     return null;
  //   }
  // }

  // get Modules
  // const apiGetModules = async (dbId, collectionId, moduleIds) => {
  //   try {
  //     const response = await axios.get(`${apiURL}/api/${dbId}/modules/`, {
  //       params: { collectionId: collectionId, moduleIds: moduleIds }
  //     })
  //     return response.data;
  //   } catch (error) {
  //     console.error('apiGetModules error: ', error);
  //     return null;
  //   }
  // }

  // get Cells
  // const apiGetCells = async (dbId, collectionId, cellIds) => {
  //   try {
  //     const response = await axios.get(`${apiURL}/api/${dbId}/cells/`, {
  //       params: { collectionId: collectionId, cellIds: cellIds }
  //     })
  //     return response.data;
  //   } catch (error) {
  //     console.error('apiGetCells error: ', error);
  //     return null;
  //   }
  // }

  /////////////////////////////////////////////////////////////////////////////////////////////
  // RENDER FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////////////////////

  const handleRowMouseOver = (cellId, rowIndex, eventType, event) => {
    setCells((prevCells) => {
      const hoveredCell = prevCells.get(cellId);
  
      if (!hoveredCell || !hoveredCell.rows) {
        console.error(`Invalid cell or rows for cellId: ${cellId}`);
        return prevCells;
      }
  
      const currentRow = hoveredCell.rows[rowIndex];
  
      if (!currentRow || !currentRow.state) {
        // No row or state, can't update
        return prevCells;
      }
  
      const newCurrentState = eventType === 'mouseenter' ? 'hover' : 'base';
  
      // Check if the new state exists in the row's state property
      if (!(newCurrentState in currentRow.state)) {
        // The 'hover' state is not defined; skip the update
        return prevCells;
      }
  
      // Only update if the currentState is different
      if (currentRow.currentState === newCurrentState) {
        // No state change needed
        return prevCells;
      }
  
      // Create updated row
      const updatedRow = {
        ...currentRow,
        currentState: newCurrentState,
      };
  
      // Create updated rows
      const updatedRows = [...hoveredCell.rows];
      updatedRows[rowIndex] = updatedRow;
  
      // Create updated cell
      const updatedCell = {
        ...hoveredCell,
        rows: updatedRows,
      };
  
      // Create a new map with the updated cell
      const updatedCells = new Map(prevCells);
      updatedCells.set(cellId, updatedCell);
  
      return updatedCells;
    });
  };
  


  const renderCells = () => {

    const evaluateFormulasInObject = (obj, parentStruct, parentKey, currentIndex = null) => {
      if (Array.isArray(obj)) {
        // Process each element in the array
        return obj.map((item, index) => evaluateFormulasInObject(item, parentStruct, parentKey, index));
      }
      else if (obj !== null && typeof obj === 'object') {
        // Process each property in the object
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'onPropValue' || key === 'offPropValue' || key === 'formula') {
            newObj[key] = value;
          }
          else {
          newObj[key] = evaluateFormulasInObject(value, parentStruct, parentKey, currentIndex);
          }
        }
        return newObj;
      }
      else if (typeof obj === 'string' && obj.startsWith('=')) {
        // Replace $index with current index in the formula string if applicable
        const formula = currentIndex !== null
          ? obj.replace('$index', currentIndex)
          : obj;

        // Convert formula string to value
        return convertFormula(formula, parentStruct, parentKey);
      }
      else {
        // Return the value as is
        return obj; 
      }
    }



    const renderCell = (cellId, cellWidth, cellHeight) => {

      const getCell = cells.get(cellId);

      if (!getCell) {
        return null;
      }

      const cell = evaluateFormulasInObject(getCell, 'cells', cellId);

      // create rows-outer-container and render rows inside
      const renderRowStructure = (rows) => {
        
        // MARK: renderRows
        // Recursive function to render rows
        const renderRows = (index, level) => {
          let i = index;
          let currentLevel = level;
          let rowsForCurrentLevel = [];
          let renderedRows = [];

          let topPos = 0;

          // Loop through rows
          while (i < rows.length) {
            const rowStyle = rows[i] && rows[i].state ? rows[i].state[rows[i].currentState] || rows[i].state['base'] || {} : {};
              
            // Loop starts at index -1 to ensure nest level 0 container is rendered
            if (i === -1) {
              i++;
              const renderRowsResult = renderRows(i, currentLevel);

              // Calculate height for this row block container
              let rowBlockHeight = 0;
              for (let j = i; j < rows.length; j++) {
                  const thisRowHeight = rows[j].state[rows[j].currentState]?.height || rows[j].state['base'].height;
                  rowBlockHeight += parseFloat(thisRowHeight, 10);
              }
              const rowBlockHeightPx = `${rowBlockHeight}px`;
              const currentRowIndex = i;

              renderedRows.push(
                <div key={`${cellId}-container-first-${cell.rows[currentRowIndex]._id}-${currentRowIndex}`} className={`nest-${currentLevel}-container-first`} style={{
                  height: rowBlockHeightPx,
                  width: '100%',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}>
                  {renderRowsResult.renderedRows}
                </div>
              )
              rowsForCurrentLevel = [];
              i = renderRowsResult.nextIndex;
            }
            // row is at current level - push it to list
            else if (rows[i].nestLevel === currentLevel) {
              const rowIndex = i;
              rowsForCurrentLevel.push(
                <div 
                  key={`${cellId}-row-${cell.rows[rowIndex]._id}-${rowIndex}`} 
                  className={`row-${rowIndex}`} 
                  onMouseEnter={(event) => handleRowMouseOver(cellId, rowIndex, 'mouseenter', event)}
                  onMouseLeave={(event) => handleRowMouseOver(cellId, rowIndex, 'mouseleave', event)}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: rows[rowIndex].state[rows[rowIndex].currentState]?.height || rows[rowIndex].state['base'].height,
                    left: rows[rowIndex].state[rows[rowIndex].currentState]?.left || rows[rowIndex].state['base'].left,
                    top: topPos,
                    padding: '0px',
                    backgroundColor: rowStyle.backgroundColor,
                    border: rowStyle.border ? rowStyle.border : 'none',
                    borderTop: rowIndex === 0 && rowStyle.border ? rowStyle.border : 'none',
                    display: 'flex',
                    flexDirection: 'row',
                    userSelect: 'none',
                    overflow: 'visible',
                    boxSizing: 'border-box',
                    zIndex: 0,
                  }}
                >
                  {rows[rowIndex].cells ? (() => {
                    let leftPos = 0;
                    
                    return rows[rowIndex].cells.map((rowCell, rowCellIndex) => {
                      //const rowTop = rowStyle.height ? parseInt(rowStyle.height, 10) * rowIndex : 0;
                      
                      // calculate cell width
                      let cellWidth = cell.columns && !rowCell.merged ? parseInt(cell.columns[rowCellIndex].width) : 0; 
                      if (rowCell.colSpan > 1) {
                        for (let spanIndex = 1; spanIndex < rowCell.colSpan; spanIndex++) {
                          const nextCol = cell.columns[rowCellIndex + spanIndex];
                          if (nextCol) {
                            cellWidth += parseInt(cell.columns[rowCellIndex + spanIndex].width, 10);
                          }
                        }
                      }

                      // calculate cell height
                      let cellHeight = rowStyle.height ? parseInt(rowStyle.height) : 0;
                      if (rowCell.rowSpan > 1) {
                        for (let spanIndex = 1; spanIndex < rowCell.rowSpan; spanIndex++) {
                          const nextRow = rows[i + spanIndex]; // get the row below
                          if (nextRow) {
                            cellHeight += parseInt(nextRow.style.height, 10);
                          }
                        }
                      }

                      if (rowCell.merged) {
                        leftPos += parseInt(cell.columns[rowCellIndex].width, 10);
                        return null;
                      }

                      const dataId = rowCell.cell ? null : `${cellId}#R${i}C${rowCellIndex}`;
                      const rowCellStyle = rows[i].cellsState ? rows[i].cellsState[rowCell.currentState] : null;
                      const inheritedHeight = rows[rowIndex].state[rows[rowIndex].currentState]?.height || rows[rowIndex].state['base'].height;
                      const inheritedWidth = cell.columns ? cell.columns[rowCellIndex].width : 0;
                      const cellElement = rowCell.cell ? renderCell(rowCell.cell, inheritedWidth, inheritedHeight) : (
                        <div key={rowCellIndex} className={`cell-${rowCellIndex}`} data-cellid={dataId} style={{
                          position: 'absolute',
                          //transition: 'all 0.2s', // causes lag when resizing
                          width: `${cellWidth}px`,
                          height: `${cellHeight}px`,
                          left: leftPos,
                          top: 0,
                          boxSizing: 'border-box',
                          zIndex: 1,
                          overflow: 'visible',
                          backgroundColor: rowCellStyle?.backgroundColor || 'transparent', 
                          border: rowCellStyle?.border || 'none',
                          borderTop: rowCellIndex === 0 && rowCellStyle?.border ? rowCellStyle.border : 'none',
                          borderLeft: rowCellIndex === 0 && rowCellStyle?.border ? rowCellStyle.border : 'none',
                        }}>
                          {rowCell.cell ? renderCell(rowCell.cell) : rowCell.value}
                        </div>
                      );

                      const elements = [cellElement];

                      // MARK: resizeHandles
                      if (cell.cellResizeHandles) {
                        // do not render the resizeW handle if resizeW is set to false at the rowCell level.  If resizeW handle prop is not set at the rowCell level, then assume it is true.
                        if (cell.cellResizeW && (rowCell.cellResizeW !== false)) {
                          const resizeHandleElement = (
                            <div 
                              key={`resize-w-${rowCellIndex}`}
                              className={`resize-w-${rowCellIndex}`}
                              data-cellid={`${dataId}#resize-w`}
                              style={{
                                position: 'absolute',
                                width: cell.cellResizeWidth,
                                top: 0,
                                height: `${cellHeight}px`,
                                left: leftPos + cellWidth - Math.ceil(cell.cellResizeWidth / 2),
                                cursor: 'col-resize',
                                backgroundColor: 'rgba(0,255,0,.2)',
                                zIndex: 6,
                              }}
                            >
                            </div>
                          );
                          elements.push(resizeHandleElement);
                        }
                        if (cell.cellResizeE && (rowCell.cellResizeE !== false)) {
                          const resizeHandleElement = (
                            <div
                              key={`resize-e-${rowCellIndex}`}
                              className={`resize-e-${rowCellIndex}`}
                              data-cellid={`${dataId}#resize-e`}
                              style={{
                                position: 'absolute',
                                width: cell.cellResizeWidth,
                                top: 0,
                                height: `${cellHeight}px`,
                                left: leftPos - Math.ceil(cell.cellResizeWidth / 2),
                                cursor: 'col-resize',
                                backgroundColor: 'rgba(0,255,0,.2)',
                                zIndex: 6,
                              }}
                            >
                            </div>
                          );
                          elements.push(resizeHandleElement);
                        }
                        if (cell.cellResizeN && (rowCell.cellResizeN !== false)) {
                          const resizeHandleElement = (
                            <div
                              key={`resize-n-${rowCellIndex}`}
                              className={`resize-n-${rowCellIndex}`}
                              data-cellid={`${dataId}#resize-n`}
                              style={{
                                position: 'absolute',
                                width: `${cellWidth}px`,
                                top: 0 - Math.ceil(cell.cellResizeWidth / 2),
                                height: cell.cellResizeWidth,
                                left: leftPos,
                                cursor: 'row-resize',
                                backgroundColor: 'rgba(0,255,0,.2)',
                                zIndex: 6,
                              }}
                            >
                            </div>
                          );
                          elements.push(resizeHandleElement);
                        }
                        if (cell.cellResizeS && (rowCell.cellResizeS !== false)) {
                          const resizeHandleElement = (
                            <div
                              key={`resize-s-${rowCellIndex}`}
                              className={`resize-s-${rowCellIndex}`}
                              data-cellid={`${dataId}#resize-s`}
                              style={{
                                position: 'absolute',
                                width: `${cellWidth}px`,
                                top: topPos + cellHeight - Math.ceil(cell.cellResizeWidth / 2),
                                height: cell.cellResizeWidth,
                                left: leftPos,
                                cursor: 'row-resize',
                                backgroundColor: 'rgba(0,255,0,.2)',
                                zIndex: 6,
                              }}
                            >
                            </div>
                          );
                          elements.push(resizeHandleElement);
                        }
                      }


                      if (cell.columns) {
                        leftPos += parseInt(cell.columns[rowCellIndex].width, 10);
                      }

                      return elements;
                    });
                  })() : null}
                </div>
              );
              topPos += parseFloat(rows[rowIndex].state[rows[rowIndex].currentState]?.height || rows[rowIndex].state['base'].height, 10);
              i++;
            }

            // nest level is greater than current level, render block of rows at current level before moving on
            else if (rows[i].nestLevel > currentLevel) {
              let rowBlockHeight = 0;
              for (let j = i-1; j > -1; j--) {
                if (rows[j].nestLevel < currentLevel) {
                  break;
                }
                rowBlockHeight += parseFloat(rows[j].style.height, 10);
              }
              const rowBlockHeightPx = `${rowBlockHeight}px`;

              renderedRows.push(
                <div key={i} className={`nest-${currentLevel}-row-block-greater`} style={{
                  height: rowBlockHeightPx,
                  overflow: 'hidden',
                }}>
                  {rowsForCurrentLevel}
                </div>
              )
              rowsForCurrentLevel = [];

              const renderRowsResult = renderRows(i, rows[i].nestLevel);
              let containerHeight = 0;
              for (let j = i; j < rows.length; j++) {
                if (rows[j].nestLevel < currentLevel + 1) {
                  break;
                }
                containerHeight += parseFloat(rows[j].style.height, 10);
              }
              const containerHeightPx = `${containerHeight}px`;
              renderedRows.push(
                <div key={i} className={`nest-${rows[i].nestLevel}-container-greater`} style={{
                  height: rows[i-1].childCollapse ? '0px' : containerHeightPx,
                  overflow: 'hidden',
                }}>
                  {renderRowsResult.renderedRows}
                </div>
              )
              rowsForCurrentLevel = [];
              i = renderRowsResult.nextIndex;
            }

            // nest level is less than current level, render block of rows at current level before returning
            else if (rows[i].nestLevel < currentLevel) {
              let rowBlockHeight = 0;
              for (let j = i-1; j > 0; j--) {
                if (rows[j].nestLevel < currentLevel) {
                  break;
                }
                rowBlockHeight += parseFloat(rows[j].style.height, 10);
              }
              const rowBlockHeightPx = `${rowBlockHeight}px`;

              if (rowsForCurrentLevel.length > 0) {
                renderedRows.push(
                  <div key={i} className={`nest-${currentLevel}-row-block-lesser`} style={{
                    height: rowBlockHeightPx,
                  }}>
                    {rowsForCurrentLevel}
                  </div>
                )
              }
              rowsForCurrentLevel = [];
              break;
            }

            else {
              i++;
            };
          }

          // Final step at each nest level to render any rows at current level before returning
          if (rowsForCurrentLevel.length > 0) {
            let rowBlockHeight = 0;
            for (let j = i-1; j > -1; j--) {
              if (rows[j].nestLevel > currentLevel) {
                break;
              }
              const thisRowHeight = rows[j].state[rows[j].currentState]?.height || rows[j].state['base'].height;
              rowBlockHeight += parseFloat(thisRowHeight, 10);
            }
            const rowBlockHeightPx = `${rowBlockHeight}px`;

            renderedRows.push(
              <div key={`${cellId}-container-last-${cell.rows[i-1]._id}-${i-1}`} className={`nest-${currentLevel}-container-last`} style={{
                width: '100%',
                height: rowBlockHeightPx,
                boxSizing: 'border-box',
              }}>
                {rowsForCurrentLevel}
              </div>
            )
            rowsForCurrentLevel = [];
          }

          return { renderedRows, nextIndex: i };
        }

        
        // Start recursive rendering of rows at index -1 to ensure nest level 0 container is rendered
        return (
          <div className='rows-outer-container' style={{
            height: '100%',
            width: '100%',
            margin: '0px',
            padding: '0px',
            boxSizing: 'border-box',
          }}>
            {renderRows(-1, 0).renderedRows}
          </div>
        );
      };
      

      
      // ====================================================================================


      const renderCellComponent = (cellWidth, cellHeight) => {

        const formulaValue = cell.formula ? convertFormula(cell.formula) : null;

        const getCursorCoords = () => {
          if (cell.cursorBox) {

            let top = 0;
            for (let i = 0; i < cell.cursorRow; i++) {
              top += parseInt(cell.rows[i].style.height, 10);
            }

            let left = 0;
            for (let i = 0; i < cell.cursorCol; i++) {
              left += parseInt(cell.columns[i].width, 10);
            }

            // Calculate width
            let width = 0;
            for (let i = cell.cursorCol; i < cell.cursorCol + cell.cursorColSpan; i++) {
              width += parseInt(cell.columns[i].width, 10);
            }

            // Calculate height
            let height = 0;
            for (let i = cell.cursorRow; i < cell.cursorRow + cell.cursorRowSpan; i++) {
              height += parseInt(cell.rows[i].style.height, 10);
            }

            return {
              top: top,
              left: left,
              width: width,
              height: height,
            }
          }
        }

        const getSelectionBoxCoords = () => {
          if (cell.selectionBox) {

            let top = 0;
            for (let i = 0; i < cell.selectionRow; i++) {
              top += parseInt(cell.rows[i].style.height, 10);
            }

            let left = 0;
            for (let i = 0; i < cell.selectionCol; i++) {
              left += parseInt(cell.columns[i].width, 10);
            }
            
            // Calculate width
            let width = 0;
            for (let i = cell.selectionCol; i < cell.selectionCol + cell.selectionColSpan; i++) {
              width += parseInt(cell.columns[i].width, 10);
            }

            // Calculate height
            let height = 0;
            for (let i = cell.selectionRow; i < cell.selectionRow + cell.selectionRowSpan; i++) {
              height += parseInt(cell.rows[i].style.height, 10);
            }

            return {
              top: top,
              left: left,
              width: width,
              height: height,
            }
          }
        }

        return (
          <Cell
            key={cellId}
            id={cellId}
            dataKey={cellId}
            type={cell ? cell.type : 'empty'}
            currentState={cell ? cell.currentState : 'normal'}
            state={cell.state}
            value={formulaValue ? formulaValue : cell ? cell.value : null}
            formula={cell ? cell.formula : null}
            placeholder={cell ? cell.placeholder : null}
            ignoreClicks={cell ? cell.ignoreClicks : true}
            cellWidth={cellWidth}
            cellHeight={cellHeight}
            cursorBox={cell.cursorBox}
            cursorCoords={getCursorCoords()}
            selectionBox={cell.selectionBox}
            selectionBoxCoords={getSelectionBoxCoords()}
          >
            {cell && cell.rows && cell.rows.length > 0 ? renderRowStructure(cell.rows) : null}
            {cell && cell.childCells && cell.childCells.length > 0 ? cell.childCells.map(childCell => renderCell(childCell)) : null}
          </Cell>
        )
      };

      return renderCellComponent(cellWidth, cellHeight);
    };

    const appCell = cells.get('app');
    return appCell.childCells.map(cellId => renderCell(cellId));
  };



  /////////////////////////////////////////////////////////////////////////////////////////////
  // EVENT HANDLERS
  /////////////////////////////////////////////////////////////////////////////////////////////


  const getCellIdsFromEvent = (event) => {
    let cellIds = [];
    let element = event.target;
    while (element) {
      if (element.dataset.cellid) {
        cellIds.push(element.dataset.cellid);
      }
      element = element.parentElement;
    }

    return cellIds;
  }


  const handleMouseMove = (event) => {
    if (!isDragging.current) return;

    const deltaX = event.clientX - startX.current;
    const deltaY = event.clientY - startY.current;

    setOperations(prevOperations => {
      return prevOperations.map(operation => {
        if (operation.triggerType === 'drag') {
          return {
            ...operation,
            status: 'ready',
            params: {
              ...operation.params,
              deltaX: deltaX,
              deltaY: deltaY,
            },
          };
        }
        else {
          return operation;
        }
      })
    });
  };


  const handleMouseUp = () => {
    isDragging.current = false;

    document.body.style.cursor = 'default';

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Iterate through operations and mark 'started' ops with 'complete' status
    setOperations(prevOperations => {
      const newOperations = prevOperations.map(operation => {
        if (operation.triggerType === 'drag' && (operation.status === 'started' || operation.status === 'ready') ) {
          return { ...operation, status: 'complete' };
        }
        else {
          return operation;
        }
      });

      return newOperations;
    });
  };


  const handleMouseDown = (event) => {
    event.preventDefault();
    isDragging.current = true;
    startX.current = event.clientX;
    startY.current = event.clientY;
    const cellIds = getCellIdsFromEvent(event);
    const eventKey = event.shiftKey ? 'clickShift' : 'click';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    if (cellIds) {
      setOperations(prevOperations => {
        const updatedOperations = [...prevOperations];
        cellIds.forEach(id => {
          let cellId = id;
          const parts = cellId.split('#');
          cellId = parts[0];
          let cellCoordString = null;
          let coordRow = null;
          let coordCol = null;
          let dragDirection = null;
          let direction = null;

          if (parts.length > 1) {
            cellCoordString = parts[1];
            coordRow = cellCoordString.split('R')[1].split('C')[0];
            coordCol = cellCoordString.split('R')[1].split('C')[1];
          }

          if (parts.length > 2) {
            direction = parts[2];
            document.body.style.cursor = direction === 'resize-ew' ? 'col-resize' : 'row-resize';
          }

          const cell = cells.get(cellId);
          if (cell && cell.eventOperations) {
            cell.eventOperations.forEach(op => {
              if (op.triggerType === eventKey || (op.triggerType === 'drag') ) {
                const modifiedTargetPropX = op.params.targetPropX ? op.params.targetPropX.replace('$col', coordCol).replace('$row', coordRow) : null;
                const modifiedTargetPropY = op.params.targetPropY ? op.params.targetPropY.replace('$col', coordCol).replace('$row', coordRow) : null;
                const targetPropXStartValue = op.params.targetPropX ? getReferenceValue(modifiedTargetPropX) : null;
                const targetPropYStartValue = op.params.targetPropY ? getReferenceValue(modifiedTargetPropY) : null;
                const fixedWidth = cell.fixedWidth;
                const fixedHeight = cell.fixedHeight;
                
                // check if operation already exists in operations
                const exists = updatedOperations.some(operation => operation.id === op.id);
                if (!exists) {
                  const coordCol = cellCoordString ? parseInt(cellCoordString.split('R')[1].split('C')[1], 10) : null;
                  const coordRow = cellCoordString ? parseInt(cellCoordString.split('R')[1].split('C')[0], 10) : null;
                  updatedOperations.push({
                    ...op,
                    status: 'ready',
                    params: {
                      coordCol: coordCol,
                      coordRow: coordRow,
                      direction: op.triggerType === 'drag' ? direction : eventKey,
                      targetPropX: op.params.targetPropX ? modifiedTargetPropX : null,
                      targetPropY: op.params.targetPropY ? modifiedTargetPropY : null,
                      targetPropXStartValue: targetPropXStartValue ? targetPropXStartValue : null,
                      targetPropYStartValue: targetPropYStartValue ? targetPropYStartValue : null,
                      deltaX: 0,
                      deltaY: 0,
                      fixedWidth: fixedWidth,
                      fixedHeight: fixedHeight,
                    },
                  });
                }
              }
            });
          }
        });
        return updatedOperations;
      });
    }
  }


  const handleKeyDown = (event) => {

    const addOperation = (op) => {
      setOperations(prevOperations => {
        const updatedOperations = [...prevOperations];

        // check if the operation already exists in operations
        const exists = updatedOperations.some(operation => operation.id === op.id);
        if (!exists) {
          updatedOperations.push({
            ...op,
            status: 'ready',
          });
          
          // process nested child operations
          if (op.eventOperations) {
            op.eventOperations.forEach(childOp => {
              const childExists = updatedOperations.some(operation => operation.id === childOp.id);
              if (!childExists) {
                updatedOperations.push({
                  ...childOp,
                  status: 'pending',
                });
              }
            });      
          }
        }

        return updatedOperations;
      });
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'ArrowDown': {
        const appCell = cells.get('app');
        const activeModule = cells.get(appCell.activeModule);
        const activeTab = cells.get(activeModule.activeTab);
        const eventKey = event.shiftKey ? `${event.key}Shift` : event.key;

        if (activeTab && activeTab.eventOperations && activeTab.eventOperations.some(op => op.triggerType === 'arrowKey')) {
          setOperations(prevOperations => {
            const updatedOperations = [...prevOperations];
            activeTab.eventOperations.forEach(op => {
              if (op.triggerType === 'arrowKey') {
                // Check if operation already exists in operations
                const exists = updatedOperations.some(operation => operation.id === op.id);
                if (!exists) {
                  updatedOperations.push({
                    ...op,
                    status: 'ready',
                    params: {
                      ...(op.params || {}),
                      direction: eventKey,
                    },
                  });
                }
              }
            });

            return updatedOperations;
          });
        }
        break;
      }
      // case 'ArrowLeft': {
      //   const activeModule = cells.get(app.activeModule);
      //   const activeTab = cells.get(activeModule.activeTab);
      //   const eventKey = event.shiftKey ? 'ArrowLeftShift' : 'ArrowLeft';

      //   if (activeTab && activeTab.eventOperations) {
      //     activeTab.eventOperations.forEach(op => {
      //       if (op.triggerType === eventKey) {
      //         addOperation(op);
      //       }
      //     });
      //   }
      //   break;
      // }
      // case 'ArrowUp': {
      //   const activeModule = cells.get(app.activeModule);
      //   const activeTab = cells.get(activeModule.activeTab);
      //   const eventKey = event.shiftKey ? 'ArrowUpShift' : 'ArrowUp';

      //   if (activeTab && activeTab.eventOperations) {
      //     activeTab.eventOperations.forEach(op => {
      //       if (op.triggerType === eventKey) {
      //         addOperation(op);
      //       }
      //     });
      //   }
      //   break;
      // }
      // case 'ArrowDown': {
      //   const activeModule = cells.get(app.activeModule);
      //   const activeTab = cells.get(activeModule.activeTab);
      //   const eventKey = event.shiftKey ? 'ArrowDownShift' : 'ArrowDown';

      //   if (activeTab && activeTab.eventOperations) {
      //     activeTab.eventOperations.forEach(op => {
      //       if (op.triggerType === eventKey) {
      //         addOperation(op);
      //       }
      //     });
      //   }
      //   break;
      // }
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////
  // JSX RETURN
  /////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div
      className="app"
      data-cellid={'app'}
      ref={appDivRef}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex="0"  // required for keydown event to work
      style={{ outline: 'none'}}
    >
      {renderCells()}
    </div>
  );
}

export default App;

