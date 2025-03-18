const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Entry = require('../models/Entry');

// Get all collections with optional filters
router.get('/', async (req, res) => {
  try {
    const { completed } = req.query;
    let collections = await Collection.find().populate('entries');
    
    if (completed !== undefined) {
      collections = collections.map(collection => ({
        ...collection.toObject(),
        entries: collection.entries.filter(entry => entry.completed === (completed === 'true'))
      }));
    }
    
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new collection
router.post('/', async (req, res) => {
  try {
    console.log('Received request to create collection:', req.body);
    
    if (!req.body.name) {
      console.error('Name is required');
      return res.status(400).json({ message: 'Name is required' });
    }

    const collection = new Collection({
      name: req.body.name,
      description: req.body.description,
    });
    
    console.log('Creating collection:', collection);
    const newCollection = await collection.save();
    console.log('Collection created successfully:', newCollection);
    
    res.status(201).json(newCollection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a collection
router.put('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    if (req.body.name) collection.name = req.body.name;
    if (req.body.description) collection.description = req.body.description;
    
    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a collection
router.delete('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    // Delete all entries associated with this collection
    await Entry.deleteMany({ collectionId: req.params.id });
    
    // Delete the collection using findByIdAndDelete
    await Collection.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: error.message });
  }
});

// Pin a collection
router.post('/:id/pin', async (req, res) => {
  try {
    // Unpin all collections first
    await Collection.updateMany({}, { isPinned: false });
    
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    collection.isPinned = true;
    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unpin a collection
router.post('/:id/unpin', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    collection.isPinned = false;
    const updatedCollection = await collection.save();
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add an entry to a collection
router.post('/:id/entries', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    const entry = new Entry({
      name: req.body.name,
      description: req.body.description,
      collectionId: req.params.id,
    });
    
    const newEntry = await entry.save();
    collection.entries.push(newEntry._id);
    await collection.save();
    
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an entry from a collection
router.delete('/:collectionId/entries/:entryId', async (req, res) => {
  try {
    const { collectionId, entryId } = req.params;
    
    // Find the collection
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    // Find and delete the entry
    const entry = await Entry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Remove entry from collection's entries array
    collection.entries = collection.entries.filter(id => id.toString() !== entryId);
    await collection.save();
    
    // Delete the entry
    await Entry.findByIdAndDelete(entryId);
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ message: error.message });
  }
});

// Toggle entry completion status
router.put('/:collectionId/entries/:entryId/toggle-completion', async (req, res) => {
  try {
    const { collectionId, entryId } = req.params;
    
    const entry = await Entry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    entry.completed = !entry.completed;
    const updatedEntry = await entry.save();
    
    res.json(updatedEntry);
  } catch (error) {
    console.error('Error toggling entry completion:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get random entry from collection
router.get('/:collectionId/random-entry', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.collectionId).populate('entries');
    if (!collection || !collection.entries.length) {
      return res.status(404).json({ message: 'No entries found' });
    }
    
    const randomIndex = Math.floor(Math.random() * collection.entries.length);
    const randomEntry = collection.entries[randomIndex];
    
    res.json(randomEntry);
  } catch (error) {
    console.error('Error getting random entry:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 