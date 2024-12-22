import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ObjectID from 'bson-objectid';
import axios from 'axios';
import Papa from 'papaparse';

const App = () => {

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // CONSTANTS
  //////////////////////////////////////////////////////////////////////////////////////////////////


  // Simplified API URL configuration
  const apiURL = 'https://koi-server.onrender.com';  // Direct URL for now
  console.log('Using API URL:', apiURL);

  const testOperations = [
    // {
    //   id: 'read-csv',
    //   opType: 'read',
    //   file: `${process.env.PUBLIC_URL}/Clinical_Trial_Sites_Dataset.csv`,
    //   targetStruct: 'data',
    //   name: 'Clinical Trial Sites',
    //   status: 'ready',
    // },
    // {
    //   id: 'update-data-collection',
    //   opType: 'update',
    //   targetStruct: 'data',
    //   targetKey: `=[operations][read-csv][result][0][data]`,
    //   db: 'production',
    //   collection: `="org_" & [app][currentOrganization] & "_data_1"`,
    //   status: 'pending',
    //   dependencies: ['read-csv'],
    // },
    // {
    //   id: 'write-data-collection-to-db',
    //   opType: 'update',
    //   targetStruct: 'data',
    //   targetKey: 'Clinical Trial Sites',
    //   db: 'production',
    //   collection: `="org_" & [app][currentOrganization] & "_data_1"`,
    //   status: 'pending',
    //   dependencies: ['update-data-collection'],
    // },
    {
      id: 'create-org-folder',
      opType: 'create',
      targetStruct: 'folders',
      path: null,
      onPropValue: `test-folder`,
      status: 'ready',
    },
    // {
    //   id: 'test-operation-1',
    //   opType: 'read',
    //   targetStruct: 'users',
    //   targetKey: ['jesse.sowa@iteostherapeutics.com', 'jdsowa@hotmail.com'],
    //   db: 'production',
    //   collection: 'users',
    //   status: 'ready',
    //   result: null,
    // },
    // {
    //   id: 'test-operation-2',
    //   opType: 'read',
    //   targetStruct: 'organizations',
    //   targetKey: '=[operations][test-operation-1][result[0].organization]',
    //   db: 'production',
    //   collection: 'organizations',
    //   status: 'pending',
    //   result: null,
    //   dependencies: ['test-operation-1'],
    // }
  ];


  //////////////////////////////////////////////////////////////////////////////////////////////////
  // STATE
  //////////////////////////////////////////////////////////////////////////////////////////////////


  const [operations, setOperations] = useState([]);
  const [undo, setUndo] = useState([]);
  const undoPos = useRef(0);
  const [app, setApp] = useState({
    currentUser: 'jdsowa@hotmail.com',
    currentOrganization: '67572b3fb3a8cc2370bf7f9a',
    currentWorkspace: 'workspace1',
  });
  const [users, setUsers] = useState(new Map());
  const [organizations, setOrganizations] = useState(new Map());
  const [workspaces, setWorkspaces] = useState(new Map());
  const [pages, setPages] = useState(new Map());
  const [modules, setModules] = useState(new Map());
  const [cells, setCells] = useState(new Map());
  const [data, setData] = useState(new Map());


  //////////////////////////////////////////////////////////////////////////////////////////////////
  // UTILITY FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////////////////////////


  // Deep clone an object
  const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  }


  //////////////////////////////////////////////////////////////////////////////////////////////////
  // API FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////////////////////////


  // Update the API configuration
  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
    },
    // Disable withCredentials since we're using Render's CORS
    withCredentials: false
  };

  // get Users from DB
  const apiGetUsers = async (userIds, dbId) => {
    try {
      console.log('apiGetUsers - Request details:', {
        userIds: Array.isArray(userIds) ? userIds : [userIds],
        dbId,
        url: `${apiURL}/api/users/`
      });
      
      const ids = Array.isArray(userIds) ? userIds : [userIds];
      const response = await axios.get(`${apiURL}/api/users/`, {
        ...axiosConfig,
        params: { 
          userIds: ids,
          dbId: dbId
        }
      });
      
      console.log('apiGetUsers - Response:', response.data);
      const results = response.data;
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      console.error('apiGetUsers - Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return null;
    }
  };

  // get Organizations from DB
  const apiGetOrganizations = async (orgIds, dbId) => {
    try {
      console.log('apiGetOrganizations - Request details:', { 
        orgIds, 
        dbId 
      });
      
      const ids = Array.isArray(orgIds) ? orgIds : [orgIds];
      const response = await axios.get(`${apiURL}/api/organizations/`, {
        ...axiosConfig,
        params: { 
          organizationIds: ids,
          dbId: dbId
        }
      });
      
      console.log('apiGetOrganizations - Response:', response.data);
      const results = response.data;
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      console.error('apiGetOrganizations - Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return null;
    }
  };

  // API function for complex queries
  const apiQueryUsers = async (queryParams, dbId) => {
    try {
      console.log('apiQueryUsers - Request details:', {
        queryParams,
        dbId,
        url: `${apiURL}/api/users/query`
      });
      
      const response = await axios.get(`${apiURL}/api/users/query`, {
        params: { 
          ...queryParams,
          dbId
        }
      });
      
      console.log('apiQueryUsers - Response details:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      return response.data;
    } catch (error) {
      console.error('apiQueryUsers - Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return null;
    }
  };

  
  const apiUpdateData = async (dbId, collection, data, metadata) => {
    try {
      const response = await axios.post(
        `${apiURL}/api/${dbId}/${collection}/update`,
        { data, metadata },
        axiosConfig
      );

      return response.data;
    } catch (error) {
      console.error('Error updating data:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return null;
    }
  };


  // Add this after the existing API functions
  const updateDataCollection = async (csvFile, collection, dbId) => {
    try {
      // Parse CSV file
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
          const csvText = event.target.result;
          const rows = csvText.split('\n');
          const headers = rows[0].split(',').map(h => h.trim());
          
          // Create metadata
          const metadata = {
            collection: collection,
            name: 'Clinical Trial Sites',
            fields: headers.map(header => ({
              name: header,
              type: 'String' // You can enhance this to detect types
            })),
            rowCount: rows.length - 1
          };

          // Parse data rows
          const data = rows.slice(1)
            .filter(row => row.trim()) // Skip empty rows
            .map(row => {
              const values = row.split(',').map(v => v.trim());
              return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
              }, {});
            });

          // Send to server
          const response = await axios.post(`${apiURL}/api/${dbId}/${collection}/update`, {
            metadata,
            data
          });

          if (response.data.success) {
            // Update local data state
            const updatedData = new Map(data);
            updatedData.set(collection, {
              metadata,
              rows: data
            });
            setData(updatedData);
            resolve(true);
          } else {
            reject(new Error('Failed to update data collection'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file'));
        reader.readAsText(csvFile);
      });
    } catch (error) {
      console.error('Error updating data collection:', error);
      throw error;
    }
  };


  // Create folder on server
  const createFolder = async (operation) => {
    try {
      console.log('createFolder - Starting folder creation:', { 
        folderName: operation.onPropValue,
        path: operation.path
      });
      
      // Construct the full path (if path is provided, join it with folder name)
      const fullPath = operation.path 
        ? `${operation.path}/${operation.onPropValue}/`
        : `${operation.onPropValue}/`;

      if (!process.env.REACT_APP_S3_BUCKET) {
        throw new Error('S3 bucket name not configured. Please set REACT_APP_S3_BUCKET environment variable.');
      }

      const response = await axios.post(
        `${apiURL}/api/folders/create`,
        { 
          bucketName: process.env.REACT_APP_S3_BUCKET,
          folderPath: fullPath
        },
        axiosConfig
      );
      
      console.log('createFolder - Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('createFolder - Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return null;
    }
  };


  //////////////////////////////////////////////////////////////////////////////////////////////////
  // USE EFFECTS
  //////////////////////////////////////////////////////////////////////////////////////////////////


  // Helper function to resolve references
  const resolveReference = (value, operations) => {
    // If not a reference string (doesn't start with '=['), return as is
    if (typeof value !== 'string' || !value.startsWith('=[')) return value;

    try {
      // Parse the reference path
      const path = value.slice(2, -1); // Remove '=[' and ']'
      const parts = path.split('][').map(part => part.replace(/\[|\]/g, ''));
      
      if (parts[0] !== 'operations') {
        console.error('resolveReference - Only operations references are supported');
        return null;
      }

      // Find the referenced operation
      const sourceOp = operations.find(op => op.id === parts[1]);
      if (!sourceOp) {
        console.error(`resolveReference - Operation ${parts[1]} not found`);
        return null;
      }

      // Get the final value using the path
      const valuePath = parts[2];
      return valuePath.split('.').reduce((acc, part) => {
        if (!acc) return null;
        
        // Handle array indexing
        if (part.includes('[') && part.includes(']')) {
          const arrayName = part.split('[')[0];
          const index = parseInt(part.split('[')[1].split(']')[0]);
          return acc[arrayName]?.[index];
        }
        
        return acc[part];
      }, sourceOp);

    } catch (error) {
      console.error('resolveReference - Failed to parse reference:', error);
      return null;
    }
  };


  // Process operations when they are added/updated
  useEffect(() => {
    const processOperations = async () => {
      console.log('processOperations start');

      // Helper function to check if all dependencies are complete
      const areDependenciesComplete = (op, allOps) => {
        if (!op.dependencies || op.dependencies.length === 0) return true;
        return op.dependencies.every(depId => {
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

      // Helper function to recursively update the nested property
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

      // Helper function to update the state props of a struct
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
      const newOperations = await Promise.all(operations.map(async (op) => {
        // Only process operations that haven't been handled yet
        if (op.status === 'ready') {
          const updatedOp = { ...op, status: 'started' };

          // Resolve any references
          const resolvedTargetKey = resolveReference(updatedOp.targetKey, operations);
          if (resolvedTargetKey === null) {
            updatedOp.status = 'error';
            updatedOp.error = 'Failed to resolve reference';
            return updatedOp;
          }
          
          if (updatedOp.opType === 'state') {
            const struct = {
              app: updatedApp,
              cells: updatedCells,
              modules: updatedModules,
              pages: updatedPages,
              workspaces: updatedWorkspaces,
              organizations: updatedOrganizations,
              users: updatedUsers,
            }[updatedOp.targetStruct];

            if (struct) updateStructState(updatedOp, struct);

            // Drag operations are only set to 'completed' in onMouseUp
            console.log('processOperations - Setting status to complete');
            if (updatedOp.triggerType !== 'drag') updatedOp.status = 'completed';
          }

          // Handle async DB CRUD operations
          if (updatedOp.opType === 'read') {
            try {
              let results = null;
              
              if (updatedOp.file) {
                // Handle file read operation
                try {
                  // Generate a new ID if not provided
                  const collectionId = updatedOp.targetKey || new ObjectID().toHexString();
                  
                  // Read and parse the CSV file
                  const response = await fetch(updatedOp.file);
                  if (!response.ok) {
                    throw new Error(`Failed to fetch file: ${response.statusText}`);
                  }
                  
                  const csvText = await response.text();
                  console.log('CSV Text first 100 chars:', csvText.substring(0, 100)); // Debug log
                  
                  // Check if we got HTML instead of CSV
                  if (csvText.trim().toLowerCase().startsWith('<!doctype html') || csvText.trim().toLowerCase().startsWith('<html')) {
                    throw new Error('Received HTML instead of CSV data. File path may be incorrect.');
                  }
                  
                  // Parse CSV data
                  const parsedData = Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true
                  });

                  if (parsedData.errors.length > 0) {
                    console.error('CSV parsing errors:', parsedData.errors);
                  }

                  // Store in data Map with flattened structure
                  const updatedDataMap = new Map(data);
                  updatedDataMap.set(collectionId, {
                    name: updatedOp.name || 'Imported Data',
                    fields: parsedData.meta.fields.map(field => ({
                      origFieldName: field,
                      currentFieldName: field,
                      type: 'string' // You can enhance this to detect types
                    })),
                    rowCount: parsedData.data.length,
                    rows: parsedData.data,
                    history: [
                      {
                        type: 'created',
                        modifiedDate: new Date().toISOString(),
                        modifiedBy: null
                      }
                    ]
                  });
                  setData(updatedDataMap);

                  // Set operation results
                  results = {
                    collectionId,
                    name: updatedOp.name || 'Imported Data',
                    fields: parsedData.meta.fields.map(field => ({
                      origFieldName: field,
                      currentFieldName: field,
                      type: 'string'
                    })),
                    rowCount: parsedData.data.length,
                    history: [
                      {
                        type: 'created',
                        modifiedDate: new Date().toISOString(),
                        modifiedBy: null
                      }
                    ]
                  };
                } catch (error) {
                  console.error('Error reading file:', error);
                  throw error;
                }
              }
              else {
                // Existing DB read logic
                switch (updatedOp.collection) {
                  case 'users':
                    results = await apiGetUsers(resolvedTargetKey, updatedOp.db);
                    if (results) {
                      results.forEach(user => {
                        const { _id, ...userWithoutId } = user;
                        updatedUsers.set(_id, userWithoutId);
                      });
                    }
                    break;
                  case 'organizations':
                    results = await apiGetOrganizations(resolvedTargetKey, updatedOp.db);
                    if (results) {
                      results.forEach(org => {
                        const { _id, ...orgWithoutId } = org;
                        updatedOrganizations.set(_id, orgWithoutId);
                      });
                    }
                    break;
                  default:
                    console.error(`processOperations - Unsupported collection type: ${updatedOp.collection}`);
                }
              }
              
              updatedOp.result = results;
              updatedOp.status = results ? 'completed' : 'error';
              if (!results) {
                updatedOp.error = updatedOp.file 
                  ? `Failed to read file: ${updatedOp.file}`
                  : `Failed to fetch ${updatedOp.collection} with id(s) ${resolvedTargetKey}`;
              }
            } catch (error) {
              console.error(`processOperations - Error in read operation:`, error);
              updatedOp.status = 'error';
              updatedOp.error = error.message;
            }
          }

          // Handle update operations
          if (updatedOp.opType === 'update') {
            try {
              // Parse CSV file if provided
              let parsedData = null;
              if (updatedOp.csvFile) {
                parsedData = await parseCSV(updatedOp.csvFile);
              }

              // Prepare metadata
              const metadata = {
                name: updatedOp.name || '',
                fields: parsedData ? Object.keys(parsedData[0]).map(field => ({
                  name: field,
                  type: 'string' // You might want to infer types here
                })) : [],
                ...updatedOp.metadata
              };

              // Call API to update data
              const result = await apiUpdateData(
                updatedOp.db,
                updatedOp.collection,
                parsedData,
                metadata
              );

              updatedOp.result = result;
              updatedOp.status = result ? 'completed' : 'error';
              if (!result) {
                updatedOp.error = 'Failed to update data';
              }
            } catch (error) {
              console.error('Update operation failed:', error);
              updatedOp.status = 'error';
              updatedOp.error = error.message;
            }
          }

          // Add this to handle CSV file updates in the operations processor
          if (updatedOp.opType === 'update' && updatedOp.csvFile) {
            try {
              const success = await updateDataCollection(
                updatedOp.csvFile,
                updatedOp.collection,
                updatedOp.db
              );
              updatedOp.status = success ? 'completed' : 'error';
            } catch (error) {
              console.error('Error in update operation:', error);
              updatedOp.status = 'error';
              updatedOp.error = error.message;
            }
          }

          // Update the operations processor to handle folder creation
          if (updatedOp.opType === 'create' && updatedOp.targetStruct === 'folders') {
            try {
              const result = await createFolder(updatedOp);
              updatedOp.result = result;
              updatedOp.status = result ? 'completed' : 'error';
              if (!result) {
                updatedOp.error = 'Failed to create folder';
              }
            } catch (error) {
              console.error('Error in folder creation:', error);
              updatedOp.status = 'error';
              updatedOp.error = error.message;
            }
          }

          return updatedOp;
        }

        // For operations that are not ready, check if they should be promoted
        if (op.status === 'pending' && areDependenciesComplete(op, operations)) {
          return { ...op, status: 'ready' };
        }

        // Return unchanged operation
        return op;
      }));

      // Check if there are any changes in the operations
      const hasChanges = newOperations.some((newOp, index) => {
        const oldOp = operations[index];
        return JSON.stringify(newOp) !== JSON.stringify(oldOp);
      });

      if (hasChanges) {
        // Remove completed operations with no dependents
        console.log('processOperations - Removing completed operations with no dependents. newOperations:', newOperations);
        const cleanedOperations = newOperations.filter(op => 
          op.status !== 'completed' ||
          dependentsOfOperation(op.id, newOperations).length > 0
        );

        // Only update operations if there are changes
        if (cleanedOperations.length !== operations.length || 
            JSON.stringify(cleanedOperations) !== JSON.stringify(operations)) {
          setOperations(cleanedOperations);
        }
      }

      // Update structures in state
      if (updatedApp) setApp(updatedApp);
      if (updatedCells) setCells(new Map(updatedCells));
      if (updatedModules) setModules(new Map(updatedModules));
      if (updatedPages) setPages(new Map(updatedPages));
      if (updatedWorkspaces) setWorkspaces(new Map(updatedWorkspaces));
      if (updatedOrganizations) setOrganizations(new Map(updatedOrganizations));
      if (updatedUsers) setUsers(new Map(updatedUsers));

      console.log('processOperations end');
    };

    if (operations.length > 0) {
      processOperations();
    }
  }, [operations]);


  //////////////////////////////////////////////////////////////////////////////////////////////////
  // PARSER
  //////////////////////////////////////////////////////////////////////////////////////////////////


  // parse a reference into a struct, key and props
  const parseReference = (ref) => {
    // Handle empty or invalid references
    if (!ref || typeof ref !== 'string') {
      return { struct: null, key: null, props: [] };
    }

    // Remove outer brackets and split into parts
    const parts = ref.slice(1, -1).split('][');
    
    // Get the struct name (first part)
    let struct = parts.shift();
    
    // Handle the key part (second part)
    let key = null;
    let props = [];
    
    if (parts.length > 0) {
      const keyPart = parts.shift();
      
      // Check if key is a numeric index
      if (/^\d+$/.test(keyPart)) {
        key = parseInt(keyPart, 10);
      } 
      // Check if key is a property name
      else if (keyPart) {
        key = keyPart;
      }
      
      // Parse remaining parts as props
      if (parts.length > 0) {
        const propsPath = parts.join('][');
        props = parsePropertyPath(propsPath);
      }
    }
    
    // If no props were found and the reference is to a Map-type state
    // default to ['value'] for backward compatibility
    const mapTypeStates = ['cells', 'users', 'organizations', 'workspaces', 'pages', 'modules'];
    if (props.length === 0 && mapTypeStates.includes(struct)) {
      props = ['value'];
    }

    return { struct, key, props };
  };

  // Update parsePropertyPath to handle more complex property paths
  const parsePropertyPath = (path) => {
    if (!path) return [];
    
    const result = [];
    const regex = /(\w+)|\[(\d+)\]|\.(\w+)/g;
    let match;

    while ((match = regex.exec(path)) !== null) {
      if (match[1]) {
        // Direct property name (e.g., "name")
        result.push(match[1]);
      }
      else if (match[2]) {
        // Array index (e.g., "[0]")
        result.push(parseInt(match[2], 10));
      }
      else if (match[3]) {
        // Dot notation property (e.g., ".name")
        result.push(match[3]);
      }
    }

    return result;
  };

  // get the value of a reference
  const getReferenceValue = (ref) => {
    const { struct, key, props } = parseReference(ref);

    const stateMapping = {
      app,
      operations,
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

    // Handle different state types
    let refValue;
    if (stateMap instanceof Map) {
      // Handle Map type state
      refValue = stateMap.get(key);
    } else if (Array.isArray(stateMap)) {
      // Handle Array type state
      const index = parseInt(key);
      if (isNaN(index) || index < 0 || index >= stateMap.length) {
        return '#REF!';
      }
      refValue = stateMap[index];
    } else if (typeof stateMap === 'object' && stateMap !== null) {
      // Handle plain object type state
      refValue = key ? stateMap[key] : stateMap;
    } else {
      return '#REF!';
    }

    if (!refValue) {
      return '#REF!';
    }

    // Navigate through props
    for (let prop of props) {
      console.log('prop', prop);
      if (refValue === null || refValue === undefined) {
        return '#REF!';
      }

      // Handle array indexing
      if (/^\d+$/.test(prop)) {
        const index = parseInt(prop);
        if (!Array.isArray(refValue) || isNaN(index) || index < 0 || index >= refValue.length) {
          return '#REF!';
        }
        refValue = refValue[index];
      }
      // Handle object property access
      else if (typeof refValue === 'object' && prop in refValue) {
        refValue = refValue[prop];
      }
      else {
        return '#REF!';
      }
    }

    return refValue === null ? '#REF!' : refValue;
  };


  // convert formula to a value
  const convertFormula = (formula, parentStruct = null, parentKey = null) => {
    const tokens = tokenizer(formula);
    console.log('tokens', tokens);
    const ast = parseTokens(tokens);
    console.log('ast', ast);
    return evaluateTokens(ast, parentStruct, parentKey);
  }


  // tokenizer
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


  // parse tokens into an AST
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


  // evaluate the AST
  const evaluateTokens = (ast, parentStruct, parentKey) => {
    if (!ast) return null;

    switch (ast.type) {
      case 'Literal':
        return ast.value;

      // case 'CellReference':
      //   const rowCellObj = getRowCellObj(ast.name, parentStruct, parentKey);
      //   return rowCellObj;

      case 'MemberExpression':
        const objectValue = evaluateTokens(ast.object, parentStruct, parentKey);
        if (typeof objectValue === 'object' && objectValue !== null && ast.property.type === 'Identifier') {
          return objectValue[ast.property.name];
        }
        throw new Error(`Cannot access property ${ast.property.name} of ${objectValue === null ? 'null' : typeof objectValue}`);
        
      case 'Reference':
        const refVal = getReferenceValue(ast.value);
        return refVal;

      // case 'RangeExpression':
      //   // Ensure helper functions exist before proceeding
      //   if (typeof extractCellReference !== 'function' || 
      //       typeof getRangeValues !== 'function' ||
      //       typeof extractReferenceString !== 'function' ||
      //       typeof generateReferencesBetween !== 'function') {
      //     console.error('Required range helper functions are not defined');
      //     return null;
      //   }

      //   if (ast.left.type === 'CellReference' && ast.right.type === 'CellReference') {
      //     const rangeLeft = extractCellReference(ast.left);
      //     const rangeRight = extractCellReference(ast.right);
      //     const cellRefPropIdentifier = ast.left.property;
      //     return getRangeValues(rangeLeft, rangeRight, cellRefPropIdentifier, parentStruct, parentKey);
      //   }
      //   else if (ast.left.type === 'Reference' && ast.right.type === 'Reference') {
      //     const leftRefString = extractReferenceString(ast.left);
      //     const rightRefString = extractReferenceString(ast.right);
      //     const references = generateReferencesBetween(leftRefString, rightRefString);
      //     const propIdentifier = ast.left.property ? ast.left.property.name : null;
          
      //     return references.map(ref => {
      //       const value = getReferenceValue(ref);
      //       return propIdentifier && typeof value === 'object' && value !== null ? 
      //         value[propIdentifier] : value;
      //     });
      //   }
      //   throw new Error(`Invalid types in RangeExpression: ${ast.left.type} and ${ast.right.type}`);

      case 'List':
        return ast.value;

      case 'FunctionCall':
        const args = ast.arguments.map(arg => evaluateTokens(arg, parentStruct, parentKey));
        switch(ast.name.toLowerCase()) {
          case 'sum': {
            const flatArgs = args.flat(Infinity);
            const numbers = flatArgs.map(val => parseFloat(val)).filter(num => !isNaN(num));
            return numbers.reduce((acc, val) => acc + val, 0);
          }
          case 'count': {
            const flatArgs = args.flat(Infinity);
            return flatArgs.length;
          }
          default:
            console.error(`Unknown function: ${ast.name}`);
            return null;
        }

      case 'IfExpression':
        const condition = evaluateTokens(ast.condition, parentStruct, parentKey);
        return condition ? 
          evaluateTokens(ast.consequent, parentStruct, parentKey) : 
          evaluateTokens(ast.alternate, parentStruct, parentKey);

      case 'InExpression': {
        const listItem = evaluateTokens(ast.item, parentStruct, parentKey);
        const listValues = ast.list.value.map(listValue => 
          evaluateTokens(listValue, parentStruct, parentKey)
        );
        return listValues.includes(listItem);
      }

      case 'NotInExpression': {
        const notListItem = evaluateTokens(ast.item, parentStruct, parentKey);
        const notListValues = ast.list.value.map(listValue => 
          evaluateTokens(listValue, parentStruct, parentKey)
        );
        return !notListValues.includes(notListItem);
      }

      case 'NotNullExpression': {
        const notNullItem = evaluateTokens(ast.item, parentStruct, parentKey);
        return notNullItem !== null;
      }

      case 'BinaryExpression': {
        const left = evaluateTokens(ast.left, parentStruct, parentKey);
        const right = evaluateTokens(ast.right, parentStruct, parentKey);

        switch(ast.operator) {
          case 'and':
            return Boolean(left) && Boolean(right);
          case 'or':
            return Boolean(left) || Boolean(right);
          case '*':
          case '/':
          case '-': {
            const leftNum = parseFloat(left);
            const rightNum = parseFloat(right);
            if (isNaN(leftNum) || isNaN(rightNum)) {
              console.error(`Invalid numeric operation: ${left} ${ast.operator} ${right}`);
              return null;
            }
            return ast.operator === '*' ? leftNum * rightNum :
                   ast.operator === '/' ? rightNum === 0 ? null : leftNum / rightNum :
                   leftNum - rightNum;
          }
          case '+': {
            const leftNum = parseFloat(left);
            const rightNum = parseFloat(right);
            return !isNaN(leftNum) && !isNaN(rightNum) ? 
              leftNum + rightNum : 
              String(left) + String(right);
          }
          case '&':
            return String(left) + String(right);
          case '<':
          case '>':
          case '<=':
          case '>=':
            return ast.operator === '<' ? left < right :
                   ast.operator === '>' ? left > right :
                   ast.operator === '<=' ? left <= right :
                   left >= right;
          case '!=':
            return left !== right;
          case '=':
            return left === right;
          default:
            throw new Error(`Unrecognized operator: ${ast.operator}`);
        }
      }

      default:
        throw new Error(`Unrecognized AST node type: ${ast.type}`);
    }
  };


  // CSV parsing function
  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };


  //////////////////////////////////////////////////////////////////////////////////////////////////
  // EVENT HANDLERS
  //////////////////////////////////////////////////////////////////////////////////////////////////


  // Add this with your other API functions
  const testApiConnection = async () => {
    try {
      console.log('Testing API connection to:', apiURL);
      const response = await axios.get(`${apiURL}/api/ping`, axiosConfig);
      console.log('Ping response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API connection test failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return null;
    }
  };

  // Update the handleKeyDown function
  const handleKeyDown = (event) => {
    console.log('handleKeyDown');
    switch (event.key) {
      case 'ArrowUp':
        const testFormula = '=[operations][0][targetKey]';
        const convertedFormula = convertFormula(testFormula);
        console.log('testFormula', convertedFormula);
        break;
      case 'ArrowDown':
        setOperations(prevOperations => {
          const updatedOperations = [...prevOperations];
          updatedOperations.push(...testOperations);  // Spread operator to add all test operations
          return updatedOperations;
        });
        break;
      case 'ArrowLeft':
        console.log('ArrowLeft');
        testApiConnection().then(result => {
          if (result) {
            alert(`API Connection Success! Server says: ${result.message}\nTimestamp: ${result.timestamp}`);
          } else {
            alert('API Connection Failed! Check console for details.');
          }
        });
        break;
    }
  }


  //////////////////////////////////////////////////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////////////////////////////////////////////////


  // Render the current workspace
  const renderWorkspace = (workspaceId) => {
  }

  // Render the app
  return (
    <div
      className="app"
      data-cellid={'app'}
      tabIndex="0"
      onKeyDown={handleKeyDown}
      style={{ outline: 'none'}}
    >
      Test Render API Connection (test folder create - attempt after updating secrets)
    </div>
  )
}

export default App;
