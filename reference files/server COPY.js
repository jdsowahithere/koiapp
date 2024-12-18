const express = require('express');
const fs = require('fs');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');
const cors = require('cors');
const { get } = require('http');
const e = require('express');
require('dotenv').config( { path: '.env.local' });


const idempotencyKeys = new Map();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Schema & Model
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// NOTE: Model names may be cached by mongoose, so may need to rename models to force re-creation

// Generic Schema
async function getDynamicModel(collectionName) {
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }

  const genericSchema = new mongoose.Schema({}, { strict: false });

  return mongoose.model(collectionName, genericSchema, collectionName);
}


// user Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true},
  lastName: { type: String, required: true},
  title: { type: String, required: true},
  organization: { type: String, required: true},
});

const User = mongoose.model('User', userSchema, 'users');


// organization Schema
const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  theme: { type: String, required: true},
  defaultWorkspaceId: { type: String, required: true},
});

const Organization = mongoose.model('Organization', organizationSchema, 'organizations');


// workspace Schema
const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

const Workspace = mongoose.model('Workspace', workspaceSchema, 'workspaces');

// page Schema
const pageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  workspaceId: { type: String, required: true},
});

const Page = mongoose.model('Page', pageSchema, 'pages');

// module Schema
const moduleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  pageId: { type: String, required: true},
});

const Module = mongoose.model('Module', moduleSchema, 'modules');

// cell Schema
const cellSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: String, required: true},
  moduleId: { type: String, required: true},
});

const Cell = mongoose.model('Cell', cellSchema, 'cells');


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Connection Pool
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const globalConnection = mongoose.createConnection();

async function getDatabaseConnection(dbId) {
  if (!globalConnection[dbId]) {
    const URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${dbId}?retryWrites=true&w=majority`;
    globalConnection[dbId] = await mongoose.createConnection(URI);
  }
  return globalConnection[dbId];
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// API Endpoints
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Get Users
app.get('/api/users/', async (req, res) => {
  console.log('get users called');
  const userIds = req.query.userIds;
  const dbId = req.query.dbId;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).send('Invalid userIds');
  }

  try {
    const dbConnection = await getDatabaseConnection(dbId);
    const UserModel = dbConnection.model('User', userSchema, 'users');
    const users = await UserModel.find({ _id: { $in: userIds } });

    if (users.length > 0) {
      console.log('users found', users);
      res.json(users);
    }
    else {
      console.log('users not found');
      res.status(404).send('Users not found');
    }
  }
  catch (err) {
    console.error('Database connection error: ', err);
    res.status(500).send('Failed to connect to database');
  }
});


// get organization
app.get('/api/organizations/', async (req, res) => {
  console.log('get organizations called');
  const organizationIds = req.query.organizationIds;
  const dbId = 'app_db';

  console.log('organizationIds', organizationIds);

  if (!Array.isArray(organizationIds) || organizationIds.length === 0) {
    return res.status(400).send('Invalid organizationIds');
  }

  try {
    const dbConnection = await getDatabaseConnection(dbId);
    const OrganizationModel = dbConnection.model('Organization', organizationSchema, 'organizations');
    const organizations = await OrganizationModel.find({ _id: { $in: organizationIds } });

    if (organizations.length > 0) {
      console.log('organizations found', organizations);
      res.json(organizations);
    }
    else {
      console.log('organizations not found');
      res.status(404).send('Organizations not found');
    }
  }
  catch (err) {
    console.error('Database connection error: ', err);
    res.status(500).send('Failed to connect to database');
  }
});


// get workspace
app.get('/api/:orgDbId/workspaces/:workspaceId', async (req, res) => {
  console.log('get workspace called');
  const { orgDbId, workspaceId } = req.params;

  console.log('orgDbId', orgDbId);
  console.log('workspaceId', workspaceId);

  try {
    const dbConnection = await getDatabaseConnection(orgDbId);
    let WorkspaceModel;
    if (dbConnection.models['Workspace']) {
      WorkspaceModel = dbConnection.models['Workspace'];
    }
    else {
      const genericSchema = new mongoose.Schema({}, { strict: false });
      WorkspaceModel = dbConnection.model('Workspace', genericSchema, 'workspaces');
    }

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (workspace) {
      console.log('workspace found', workspace);
      res.json(workspace);
    }
    else {
      res.status(404).send('Workspace not found');
    }
  }
  catch (err) {
    console.error('Database connection error: ', err);
    res.status(500).send('Failed to connect to database');
  }
});


// get pages
app.get('/api/:orgDbId/pages/', async (req, res) => {
  console.log('get pages called');
  const { orgDbId } = req.params;
  const workspaceId = req.query.workspaceId + "_pages";
  const pageIds = req.query.pageIds;

  console.log('orgDbId', orgDbId);
  console.log('pageIds', pageIds);

  if (!Array.isArray(pageIds) || pageIds.length === 0) {
    return res.status(400).send('Invalid pageIds');
  }

  try {
    const dbConnection = await getDatabaseConnection(orgDbId);
    const PageModel = dbConnection.model('Page', pageSchema, workspaceId);
    const pages = await PageModel.find({ _id: { $in: pageIds } });

    if (pages.length > 0) {
      console.log('pages found', pages);
      res.json(pages);
    }
    else {
      console.log('pages not found');
      res.status(404).send('Pages not found');
    }
  }
  catch (err) {
    console.error('Database connection error: ', err);
    res.status(500).send('Failed to connect to database');
  }
});

// get modules
app.get('/api/:dbId/modules/', async (req, res) => {
  console.log('get modules called');
  const { dbId } = req.params;
  const collectionId = req.query.collectionId;
  const moduleIds = req.query.moduleIds;

  console.log('dbId', dbId);
  console.log('collectionId', collectionId);
  console.log('moduleIds', moduleIds);

  if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
    return res.status(400).send('Invalid moduleIds');
  }

  try {
    const dbConnection = await getDatabaseConnection(dbId);
    const ModuleModel = dbConnection.model('Module', moduleSchema, collectionId);
    const modules = await ModuleModel.find({ _id: { $in: moduleIds } });

    if (modules.length > 0) {
      console.log('modules found', modules);
      res.json(modules);
    }
    else {
      console.log('modules not found');
      res.status(404).send('Modules not found');
    }
  }
  catch (err) {
    console.error('Database connection error: ', err);
    res.status(500).send('Failed to connect to database');
  }
});

// retrieve api
app.get('/api/:dbId/:collectionId/', async (req, res) => {
  console.log('retrieve called');
  const { dbId, collectionId } = req.params;
  const formula = req.query.formula;
  const references = req.query.references;

  console.log('dbId', dbId);
  console.log('collectionId', collectionId);
  console.log('formula', formula);

  try {
    const dbConnection = await getDatabaseConnection(dbId);
    const genericSchema = new mongoose.Schema({}, { strict: false });
    const CollectionModel = dbConnection.model('Collection', genericSchema, collectionId);
    const collection = await CollectionModel.find({ _id : { $in: '662aabfff919a72819aa37be'} });

    if (collection) {
      console.log('collection found', collection);
      res.json(collection);
    }
    else {
      console.log('collection not found');
      res.status(404).send('Collection not found');
    }
  }
  catch (err) {
    console.error('Database connection error: ', err);
    res.status(500).send('Failed to connect to database');
  }
});

// get cells
app.get('/api/:dbId/cells/', async (req, res) => {
  console.log('get cells called');
  const { dbId } = req.params;
  const collectionId = req.query.collectionId;
  const cellIds = req.query.cellIds;

  console.log('dbId', dbId);
  console.log('collectionId', collectionId);
  console.log('cellIds', cellIds);

  if (!Array.isArray(cellIds) || cellIds.length === 0) {
    return res.status(400).send('Invalid cellIds');
  }

  try {
    const dbConnection = await getDatabaseConnection(dbId);
    const CellModel = dbConnection.model('Cell', cellSchema, collectionId);
    const cells = await CellModel.find({ _id: { $in: cellIds } });

    if (cells.length > 0) {
      console.log('cells found', cells);
      res.json(cells);
    }
    else {
      console.log('cells not found');
      res.status(404).send('Cells not found');
    }
  }
  catch (err) {
    console.error('Database connection error: ', err);
    res.status(500).send('Failed to connect to database');
  }
});
  