import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getCollections, deleteCollection, pinCollection, unpinCollection } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import CreateCollectionModal from '../components/CreateCollectionModal';

const HomeScreen = ({ navigation }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [expandedCollections, setExpandedCollections] = useState({});

  const loadCollections = async () => {
    try {
      const response = await getCollections();
      let collectionsData = response.data;
      
      // If no collection is pinned, pin the most recently updated one
      const pinnedCollection = collectionsData.find(c => c.isPinned);
      if (!pinnedCollection && collectionsData.length > 0) {
        const mostRecent = collectionsData.reduce((prev, current) => {
          return new Date(prev.lastUpdated) > new Date(current.lastUpdated) ? prev : current;
        });
        await pinCollection(mostRecent._id);
        collectionsData = await (await getCollections()).data;
      }
      
      setCollections(collectionsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCollections();
    }, [])
  );

  useEffect(() => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  const handleDelete = async (id) => {
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
              await deleteCollection(id);
              setCollections(collections.filter(c => c._id !== id));
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert('Error', 'Failed to delete collection. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleUnpin = async (collection) => {
    try {
      await unpinCollection(collection._id);
      // Find the most recently created collection
      const unpinnedCollections = collections.filter(c => !c.isPinned);
      if (unpinnedCollections.length > 0) {
        const mostRecent = unpinnedCollections.reduce((prev, current) => {
          return new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev;
        });
        await pinCollection(mostRecent._id);
      }
      await loadCollections();
    } catch (error) {
      Alert.alert('Error', 'Failed to update pin status');
    }
  };

  const toggleExpanded = (collectionId) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionId]: !prev[collectionId]
    }));
  };

  const renderPinnedEntries = (entries) => {
    if (!entries || entries.length === 0) return null;
    
    return (
      <View style={styles.entriesContainer}>
        <ScrollView 
          style={styles.entriesScrollView}
          showsVerticalScrollIndicator={true}
        >
          {entries.map((entry, index) => (
            <View key={entry._id} style={styles.entryItem}>
              <Text style={styles.entryName}>{entry.name}</Text>
              {entry.description && (
                <Text style={styles.entryDescription}>{entry.description}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPinnedCollection = () => {
    const pinnedCollection = collections.find(c => c.isPinned);
    if (!pinnedCollection) return null;

    return (
      <View style={styles.pinnedSection}>
        <Text style={styles.pinnedTitle}>Pinned Collection</Text>
        <View style={styles.pinnedCollectionContainer}>
          <View style={styles.pinnedCollectionItem}>
            <TouchableOpacity
              onPress={() => handleUnpin(pinnedCollection)}
              style={styles.pinButton}
            >
              <Icon name="push-pin" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.collectionContent}>
              <Text style={styles.collectionName}>{pinnedCollection.name}</Text>
              <Text style={styles.pinnedItemCount}>
                {pinnedCollection.entries?.length || 0} items
              </Text>
              {pinnedCollection.description && (
                <Text style={styles.pinnedDescription}>{pinnedCollection.description}</Text>
              )}
              {renderPinnedEntries(pinnedCollection.entries)}
            </View>
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => navigation.navigate('Collection', { collection: pinnedCollection })}
            >
              <Icon name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCollection = ({ item }) => {
    if (item.isPinned) return null;
    
    const isExpanded = expandedCollections[item._id];
    
    return (
      <View style={styles.collectionItem}>
        <TouchableOpacity
          style={styles.collectionContent}
          onPress={() => toggleExpanded(item._id)}
        >
          <View style={styles.collectionHeader}>
            <View style={styles.collectionTitleSection}>
              <Text style={styles.collectionName}>{item.name}</Text>
              <Text style={styles.itemCount}>{item.entries?.length || 0} items</Text>
            </View>
            <Text style={styles.collectionDate}>
              {new Date(item.lastUpdated).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          {isExpanded && item.description && (
            <Text style={styles.collectionDescription}>{item.description}</Text>
          )}
        </TouchableOpacity>
        {isExpanded && (
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => navigation.navigate('Collection', { collection: item })}
          >
            <Icon name="arrow-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Listify</Text>
        <Text style={styles.date}>{currentDate}</Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.pinnedWrapper}>
          {renderPinnedCollection()}
        </View>
        <View style={styles.collectionsContainer}>
          <Text style={styles.sectionTitle}>Your Collections</Text>
          <FlatList
            data={collections.filter(c => !c.isPinned)}
            renderItem={renderCollection}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={loadCollections}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="add" size={32} color="#8BA89C" />
      </TouchableOpacity>

      <CreateCollectionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadCollections}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8BA89C',
  },
  header: {
    paddingTop: 3,
    paddingBottom: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 10,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#E5E7E6',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 20,
  },
  collectionsContainer: {
    flex: 1,
  },
  pinnedWrapper: {
    backgroundColor: '#E5E7E6',
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
    maxHeight: 350,
  },
  pinnedSection: {
    padding: 10,
    paddingBottom: 5,
  },
  pinnedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    marginTop: 5,
    marginBottom: 10,
    color: '#333',
  },
  pinnedCollectionContainer: {
    position: 'relative',
  },
  pinnedCollectionItem: {
    backgroundColor: '#5C6B63',
    borderRadius: 15,
    padding: 16,
    minHeight: 250,
    position: 'relative',
  },
  pinButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  collectionItem: {
    backgroundColor: '#D4A69E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    minHeight: 70,
  },
  collectionContent: {
    flex: 1,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  collectionTitleSection: {
    flex: 1,
    marginRight: 10,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  itemCount: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  collectionDate: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginTop: 10,
    marginLeft: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pinnedItemCount: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
    marginBottom: 6,
  },
  pinnedDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  entriesContainer: {
    marginTop: 4,
    height: 150,
    marginBottom: 30,
  },
  entriesScrollView: {
    flex: 1,
  },
  entryItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  entryName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  entryDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  viewMoreButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
    marginBottom: 8,
  },
  navigateButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 6,
  },
});

export default HomeScreen; 