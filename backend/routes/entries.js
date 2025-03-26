const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const Collection = require('../models/Collection');

// Update an entry
router.put('/:id', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    if (req.body.name) entry.name = req.body.name;
    if (req.body.description) entry.description = req.body.description;
    if (req.body.completed !== undefined) entry.completed = req.body.completed;
    if (req.body.isPinned !== undefined) entry.isPinned = req.body.isPinned;
    
    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle pin status
router.put('/:id/toggle-pin', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    entry.isPinned = !entry.isPinned;
    const updatedEntry = await entry.save();
    
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Remove entry from collection
    const collection = await Collection.findById(entry.collectionId);
    if (collection) {
      collection.entries = collection.entries.filter(id => id.toString() !== entry._id.toString());
      await collection.save();
    }
    
    // Delete the entry
    await entry.remove();
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 