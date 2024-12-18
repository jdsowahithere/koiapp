// Update data collection with CSV data
app.post('/api/:dbId/:collectionId/update', async (req, res) => {
  console.log('update data collection called');
  const { dbId, collectionId } = req.params;
  const { data, metadata } = req.body;

  console.log('dbId', dbId);
  console.log('collectionId', collectionId);
  console.log('metadata', metadata);

  try {
    // Get database connection
    const dbConnection = await getDatabaseConnection(dbId);
    
    // Create/update metadata in 'data' collection
    if (metadata) {
      const DataModel = dbConnection.model('Data', new mongoose.Schema({}, { strict: false }), 'data');
      await DataModel.findOneAndUpdate(
        { collectionId: collectionId },
        metadata,
        { upsert: true, new: true }
      );
    }

    // Create/update the actual data records
    if (data && Array.isArray(data)) {
      const DataCollectionModel = dbConnection.model('DataCollection', new mongoose.Schema({}, { strict: false }), collectionId);
      
      // Clear existing data if needed
      await DataCollectionModel.deleteMany({});
      
      // Insert new data
      await DataCollectionModel.insertMany(data);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Failed to update data collection');
  }
}); 