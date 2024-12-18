import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { v4 as uuidv4 } from 'uuid';


const App = () => {


  /////////////////////////////////////////////////////////////////////////////////////////////
  // MARK: CONSTANTS
  /////////////////////////////////////////////////////////////////////////////////////////////


  const testOperations = [
    {
      id: 'down-operation',
      triggerType: 'arrowDown',
      targetStruct: 'app',
      targetKey: null,
      opType: 'state',
      triggerType: 'arrowDown',
      status: 'ready',
      targetProp: 'newProp',
      onPropValue: `workspace2`,
      offPropValue: `workspace1`,
    },
  ];

  /////////////////////////////////////////////////////////////////////////////////////////////
  // MARK: STATE
  /////////////////////////////////////////////////////////////////////////////////////////////
  

  const [operations, setOperations] = useState([]);
  const [undo, setUndo] = useState([]);
  const undoPos = useRef(0); // Cursor position in undo list
  
  const [app, setApp] = useState({
    currentWorkspace: 'workspace1',
  });
  const [users, setUsers] = useState(new Map());
  const [organizations, setOrganizations] = useState(new Map());
  const [workspaces, setWorkspaces] = useState(new Map());
  const [pages, setPages] = useState(new Map());
  const [modules, setModules] = useState(new Map());
  const [cells, setCells] = useState(new Map([
    ['test-cell', {
      id: 'test-cell', 
      type: 'content', 
      value: 'Test Cell',
    }],
  ]));


  /////////////////////////////////////////////////////////////////////////////////////////////
  // MARK: UTILITY FUNCTIONS
  /////////////////////////////////////////////////////////////////////////////////////////////


  const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj)); // Simple deep clone
  };


  /////////////////////////////////////////////////////////////////////////////////////////////
  // MARK: USE EFFECTS
  /////////////////////////////////////////////////////////////////////////////////////////////


  // MARK: processOperations
  useEffect(() => {

    const processOperations = async () => {
      console.log('processOperations start');

      // Helper function to check if all dependencies are complete
      const areDependenciesComplete = (op, allOps) => {
        op.dependencies.every(depId => {
          const depOp = allOps.find(o => o.id === depId);
          return depOp?.status === 'completed';
        });
      };

      // Helper function to get dependents of a given operation
      const dependentsOfOperation = (opId, allOps) => {
        return allOps.filter(op => 
          op.status === 'pending' &&
          Array.isArray(op.dependencies) &&
          op.dependencies.includes(opId)
        );  
      }

      // Helper function to recursively get the current nested property value
      const getNestedProperty = (obj, pathArray) => {
        return pathArray.reduce((acc, key) => (acc && acc[key] !== 'undefined') ? acc[key] : undefined, obj);
      };

      // Helper function to recurisvely update the nested property
      const updateNestedProperty = (obj, pathArray, value) => {
        console.log('updateNestedProperty. obj: ', obj, 'pathArray: ', pathArray, 'value: ', value);
        const clonedObj = deepClone(obj);

        let current = clonedObj;

        for (let i = 0; i < pathArray.length - 1; i++) {
          const key = pathArray[i];
          const nextKey = pathArray[i + 1];

          // Determine if the next key is an array index
          const nextKeyIsIndex = typeof nextKey === 'number';

          // Initialize the current key if it doesn't exist
          if (!(key in current)) {
            current[key] = nextKeyIsIndex ? [] : {};
          }

          // Ensure current key matches the expected type
          if (nextKeyIsIndex && !Array.isArray(current[key])) {
            console.log('current[key] should be an array');
          }
          if (!nextKeyIsIndex && Array.isArray(current[key])) {
            console.log('current[key] should be an object');
          }

          // Move deeper into the object or array
          current = current[key];
        }

        // Set the value at the deepest level
        current[pathArray[pathArray.length - 1]] = value;
        console.log('about to return clonedObj: ', clonedObj);
        return clonedObj; // Return the modified clone
      };
      

      const updateStructState = (operation, updatedStruct) => {
        const targetStruct = operation.targetStruct;
        const targetKey = operation.targetKey;
        let targetPropPath = operation.targetProp?.split('.') || [];

        const target = updatedStruct instanceof Map
          ? updatedStruct.get(targetKey)
          : targetKey === null
          ? updatedStruct // If targetKey is null, target the root object (e.g. app)
          : updatedStruct[targetKey];

        if (!target) return;

        const updatedTarget = { ...target }; // Ensure immutability

        // Get current value of the target property
        const currentValue = targetPropPath.reduce((acc, key) => acc?.[key], updatedTarget);

        // Determine new value of target property and handle toggling
        const onPropCalc = operation.onPropValue;
        const offPropCalc = operation.offPropValue || null;
        const newValue = (currentValue === onPropCalc && offPropCalc) ? offPropCalc: onPropCalc;

        // Update the nested property
        const updatedTargetWithChanges = updateNestedProperty(updatedTarget, targetPropPath, newValue);

        // Update struct with modified target
        if (updatedStruct instanceof Map) {
          // For map structs like 'cells', update the target object in the map
          updatedStruct.set(targetKey, updatedTargetWithChanges);
        }
        else if (targetKey === null) {
          // For object structs like 'app', update the root object directly
          Object.assign(updatedStruct, updatedTargetWithChanges);
        }
        else {
          console.log('targetKey unexpectedly set for non-map struct');
        }
      };

      // Determine which structs need updates
      const needsUpdate = operations.reduce((acc, op) => {
        if (op.targetStruct in acc) {
          acc[op.targetStruct] = true;
        }
        return acc;
      }, {
        app: false,
        cells: false,
        modules: false,
        pages: false,
        workspaces: false,
        organizations: false,
        users: false,
      });

      // Lazily create temporary stores
      const updatedApp = needsUpdate.app ? { ...app } : null;
      const updatedCells = needsUpdate.cells ? new Map(cells) : null;
      const updatedModules = needsUpdate.modules ? new Map(modules) : null;
      const updatedPages = needsUpdate.pages ? new Map(pages) : null;
      const updatedWorkspaces = needsUpdate.workspaces ? new Map(workspaces) : null;
      const updatedOrganizations = needsUpdate.organizations ? new Map(organizations) : null;
      const updatedUsers = needsUpdate.users ? new Map(users) : null;

      // Process operations
      const newOperations = operations.map(op => {
        if (op.status === 'ready') {
          op.status = 'started';

          if (op.opType === 'state') {
            const struct = {
              app: updatedApp,
              cells: updatedCells,
              modules: updatedModules,
              pages: updatedPages,
              workspaces: updatedWorkspaces,
              organizations: updatedOrganizations,
              users: updatedUsers,
            }[op.targetStruct];

            if (struct) updateStructState(op, struct);

            // Drag operations are only set to 'completed' in onMouseUp
            console.log('setting Status to complete');
            if (op.triggerType !== 'drag') op.status = 'completed';
          }

          // Handle async DB CRUD operations
          if (op.opType === 'retrieve') {
            console.log('retrieve operation');
            // result = await apiRetrieve(operation.db, operation.collection, operation.formula, operation.references);
            // op.result = result;
            op.status = 'completed';
          }
        }

        // Promote 'pending' to 'ready' if dependencies are complete
        if (op.status === 'pending' && areDependenciesComplete(op, operations)) {
          op.status = 'ready';
        }

        return op;
      });

      // Remove completed operations with no dependents
      console.log('Removing completed operations with no dependents.  newOperations: ', newOperations);
      const cleanedOperations = newOperations.filter(op => 
        op.status !== 'completed' ||
        dependentsOfOperation(op.id, newOperations).length > 0
      );

      setOperations(cleanedOperations);

      // Update structures in state
      if (updatedApp) setApp(updatedApp);
      if (updatedCells) setCells(new Map(updatedCells));
      if (updatedModules) setModules(updatedModules);
      if (updatedPages) setPages(updatedPages);
      if (updatedWorkspaces) setWorkspaces(updatedWorkspaces);
      if (updatedOrganizations) setOrganizations(updatedOrganizations);
      if (updatedUsers) setUsers(updatedUsers);

      console.log('processOperations end');
    };

    if (operations.length > 0) {
      processOperations();
    }
  }, [operations]);


  /////////////////////////////////////////////////////////////////////////////////////////////
  // MARK: EVENT HANDLERS
  /////////////////////////////////////////////////////////////////////////////////////////////


  const handleKeyDown = (e) => {

    switch (e.key) {
      case 'ArrowUp':
        console.log('ArrowUp');
        break;
      case 'ArrowDown':
        setOperations(prevOperations => {
          const updatedOperations = [...prevOperations];
          updatedOperations.push(testOperations[0]);
          return updatedOperations;
        })
        break;
    }
  };


  /////////////////////////////////////////////////////////////////////////////////////////////
  // MARK: JSX RETURN
  /////////////////////////////////////////////////////////////////////////////////////////////


  return (
    <div
      className="app"
      data-cellid={'app'}
      tabIndex="0"  // required for keydown event to work
      onKeyDown={handleKeyDown}
      style={{ outline: 'none'}}
    >
      Test
    </div>
  );
}

export default App;

