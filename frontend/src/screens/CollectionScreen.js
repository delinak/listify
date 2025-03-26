import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Animated,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  addEntry, 
  updateEntry, 
  deleteEntry, 
  deleteCollection, 
  pinCollection, 
  updateCollection,
  toggleEntryCompletion,
  getRandomEntry,
  toggleEntryPin
} from '../services/api';

const CollectionScreen = ({ route, navigation }) => {
  const { collection } = route.params;
  const [entries, setEntries] = useState(collection.entries || []);
  const [newEntryName, setNewEntryName] = useState('');
  const [newEntryDescription, setNewEntryDescription] = useState('');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [collectionName, setCollectionName] = useState(collection.name);
  const [collectionDescription, setCollectionDescription] = useState(collection.description || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempCollectionName, setTempCollectionName] = useState(collection.name);
  const [tempCollectionDescription, setTempCollectionDescription] = useState(collection.description || '');
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [randomEntry, setRandomEntry] = useState(null);
  const [showRandomEntry, setShowRandomEntry] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingEntryField, setEditingEntryField] = useState(null); // 'name' or 'description'
  const [tempEntryValue, setTempEntryValue] = useState('');

  const handlePin = async () => {
    try {
      await pinCollection(collection._id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to pin collection');
    }
  };

  const handleDeleteCollection = async () => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection(collection._id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete collection');
            }
          },
        },
      ]
    );
  };

  const handleAddEntry = async () => {
    if (!newEntryName.trim()) {
      Alert.alert('Error', 'Entry name is required');
      return;
    }

    try {
      const response = await addEntry(collection._id, {
        name: newEntryName,
        description: newEntryDescription,
      });
      setEntries([...entries, response.data]);
      setNewEntryName('');
      setNewEntryDescription('');
      setShowAddEntry(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add entry');
    }
  };

  const handleUpdateCollectionField = async (field, value) => {
    try {
      await updateCollection(collection._id, {
        [field]: value
      });
      if (field === 'name') {
        setCollectionName(value);
        setIsEditingName(false);
      } else if (field === 'description') {
        setCollectionDescription(value);
        setIsEditingDescription(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update collection');
      if (field === 'name') {
        setTempCollectionName(collectionName);
      } else if (field === 'description') {
        setTempCollectionDescription(collectionDescription);
      }
    }
  };

  const handleUpdateEntry = async (entry) => {
    try {
      const response = await updateEntry(entry._id, {
        name: entry.name,
        description: entry.description
      });
      setEntries(entries.map(e => e._id === entry._id ? response.data : e));
      setEditingEntry(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (isDeleting) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              console.log('Deleting entry:', { collectionId: collection._id, entryId });
              await deleteEntry(collection._id, entryId);
              setEntries(entries.filter(e => e._id !== entryId));
            } catch (error) {
              console.error('Error deleting entry:', error.response?.data || error.message);
              Alert.alert('Error', 'Failed to delete entry');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleCompletion = async (entryId) => {
    try {
      const response = await toggleEntryCompletion(collection._id, entryId);
      if (response.data) {
        setEntries(entries.map(entry =>
          entry._id === entryId ? { ...entry, completed: !entry.completed } : entry
        ));
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      Alert.alert('Error', 'Failed to toggle completion status');
    }
  };

  const handleGetRandomEntry = async () => {
    try {
      const response = await getRandomEntry(collection._id);
      setRandomEntry(response.data);
      setShowRandomEntry(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get random entry');
    }
  };

  const sortEntries = (entriesToSort, order) => {
    return [...entriesToSort].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    setSortOrder(newOrder);
    setEntries(sortEntries(entries, newOrder));
  };

  const handleUpdateEntryField = async (entryId, field, value) => {
    try {
      const entryToUpdate = entries.find(e => e._id === entryId);
      if (!entryToUpdate) return;

      const response = await updateEntry(entryId, {
        ...entryToUpdate,
        [field]: value
      });

      setEntries(entries.map(e => e._id === entryId ? response.data : e));
      setEditingEntryId(null);
      setEditingEntryField(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update entry');
    }
  };

  const renderEntry = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.entryItem,
        item.completed && styles.completedEntry,
        expandedEntry === item._id && styles.expandedEntry
      ]}
      onPress={() => setExpandedEntry(expandedEntry === item._id ? null : item._id)}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryTitleContainer}>
          {item.completed && (
            <Icon name="check-circle" size={20} color="rgba(76, 175, 80, 0.4)" style={styles.checkmark} />
          )}
          {editingEntryId === item._id && editingEntryField === 'name' ? (
            <TextInput
              style={styles.entryNameInput}
              value={tempEntryValue}
              onChangeText={setTempEntryValue}
              onBlur={() => handleUpdateEntryField(item._id, 'name', tempEntryValue)}
              autoFocus
            />
          ) : (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                setEditingEntryId(item._id);
                setEditingEntryField('name');
                setTempEntryValue(item.name);
              }}
            >
              <Text style={styles.entryName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {expandedEntry === item._id && (
        <Animated.View style={styles.expandedContent}>
          {editingEntryId === item._id && editingEntryField === 'description' ? (
            <TextInput
              style={styles.entryDescriptionInput}
              value={tempEntryValue}
              onChangeText={setTempEntryValue}
              onBlur={() => handleUpdateEntryField(item._id, 'description', tempEntryValue)}
              multiline
              autoFocus
            />
          ) : (
            <TouchableOpacity
              onPress={() => {
                setEditingEntryId(item._id);
                setEditingEntryField('description');
                setTempEntryValue(item.description || '');
              }}
            >
              <Text style={styles.entryDescription}>
                {item.description || 'Tap to add description'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.expandedActions}>
            <TouchableOpacity
              style={[styles.actionButton, item.completed && styles.completedButton]}
              onPress={() => handleToggleCompletion(item._id)}
            >
              <Text style={styles.actionButtonText}>
                {item.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={() => handleDeleteEntry(item._id)}
            >
              <Icon name="delete" size={22} color="rgba(255, 82, 82, 0.8)" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            {isEditingName ? (
              <TextInput
                style={styles.headerTitleInput}
                value={tempCollectionName}
                onChangeText={setTempCollectionName}
                onBlur={() => handleUpdateCollectionField('name', tempCollectionName)}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={() => {
                setTempCollectionName(collectionName);
                setIsEditingName(true);
              }}>
                <Text style={styles.headerTitle}>{collectionName}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.creationDate}>
              {new Date(collection.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleSortOrder} style={styles.headerButton}>
            <Icon 
              name={sortOrder === 'newest' ? 'arrow-downward' : 'arrow-upward'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePin} style={styles.headerButton}>
            <Icon name="push-pin" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteCollection} style={styles.headerButton}>
            <Icon name="delete" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.descriptionContainer}>
          {isEditingDescription ? (
            <TextInput
              style={styles.descriptionInput}
              value={tempCollectionDescription}
              onChangeText={setTempCollectionDescription}
              onBlur={() => handleUpdateCollectionField('description', tempCollectionDescription)}
              placeholder="Add description"
              multiline
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => {
              setTempCollectionDescription(collectionDescription);
              setIsEditingDescription(true);
            }}>
              <Text style={styles.descriptionText}>
                {collectionDescription || 'Tap to add description'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
        />

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowAddEntry(true)}
          >
            <Icon name="add" size={32} color="#8BA89C" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fab, styles.randomFab]}
            onPress={handleGetRandomEntry}
          >
            <Icon name="shuffle" size={24} color="#8BA89C" />
          </TouchableOpacity>
        </View>
      </View>

      {showAddEntry && (
        <View style={styles.addEntryForm}>
          <TextInput
            style={styles.input}
            placeholder="Entry name"
            value={newEntryName}
            onChangeText={setNewEntryName}
            autoFocus
          />
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Description (optional)"
            value={newEntryDescription}
            onChangeText={setNewEntryDescription}
            multiline
            numberOfLines={3}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowAddEntry(false);
                setNewEntryName('');
                setNewEntryDescription('');
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={handleAddEntry}
            >
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Random Entry Modal */}
      <Modal
        visible={showRandomEntry}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRandomEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Random Entry</Text>
            {randomEntry && (
              <>
                <Text style={styles.modalEntryName}>{randomEntry.name}</Text>
                {randomEntry.description && (
                  <Text style={styles.modalEntryDescription}>{randomEntry.description}</Text>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRandomEntry(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8BA89C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 25,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#E5E7E6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  descriptionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  entryItem: {
    backgroundColor: '#D4A69E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  completedEntry: {
    backgroundColor: '#E5B5AE',
  },
  expandedEntry: {
    marginBottom: 15,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkmark: {
    marginRight: 8,
  },
  entryName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  expandedContent: {
    marginTop: 10,
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#8BA89C',
  },
  completedButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteIconButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginLeft: 16,
  },
  randomFab: {
    backgroundColor: '#FFFFFF',
  },
  bottomButtons: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
  },
  addEntryForm: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  addButton: {
    backgroundColor: '#8BA89C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  headerTitleInput: {
    fontSize: 25,
    color: '#FFFFFF',
    fontWeight: '500',
    padding: 0,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  creationDate: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  modalEntryName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  modalEntryDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  modalCloseButton: {
    backgroundColor: '#8BA89C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  entryNameInput: {
    fontSize: 16,
    color: '#FFFFFF',
    padding: 0,
    flex: 1,
  },
  entryDescriptionInput: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    padding: 0,
    marginBottom: 10,
  },
});

export default CollectionScreen; 