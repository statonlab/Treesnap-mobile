import React, {Component, PropTypes} from 'react'
import {
  View,
  ListView,
  StyleSheet,
  Text,
  Image
} from 'react-native'
import Header from '../components/Header'
import Colors from '../helpers/Colors'
import Icon from 'react-native-vector-icons/Ionicons'
import realm from '../db/Schema'
import moment from 'moment'
import {MKButton} from 'react-native-material-kit'
import Elevation from '../helpers/Elevation'
import Observation from '../helpers/Observation'

export default class ObservationsScene extends Component {
  constructor(props) {
    super(props)

    this.dataSource  = new ListView.DataSource({
      rowHasChanged          : (r1, r2) => r1.id !== r2.id,
      sectionHeaderHasChanged: () => {
      }
    })
    let submissions = realm.objects('Submission')

    this.state = {
      hasData    : (submissions.length > 0),
      submissions: this.dataSource.cloneWithRowsAndSections(this._createMap(submissions))
    }
  }

  _createMap(submissions) {
    let synced   = []
    let unsynced = []
    let list     = {}

    submissions.map(submission => {
      if (submission.synced) {
        synced.push(submission)
      } else {
        unsynced.push(submission)
      }
    })

    if (unsynced.length > 0) {
      list = {
        'Needs Uploading': unsynced
      }
    }

    if (synced.length > 0) {
      list = {
        ...list,
        'Uploaded': synced
      }
    }

    return list
  }

  _renderRow = (submission) => {
    let images = JSON.parse(submission.images)
    return (
      <MKButton style={styles.row} key={submission.id} rippleColor="rgba(10,10,10,.1)" onPress={() => this._goToEntryScene(submission)}>
        <Image source={{uri: images[0]}} style={styles.image}/>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{submission.name}</Text>
          <Text style={styles.body}>{moment(submission.date, 'MM-DD-YYYY HH:mm:ss').format('MMMM Do YYYY')}</Text>
          <Text style={styles.body}>Near {submission.location.latitude.toFixed(4)}, {submission.location.longitude.toFixed(4)}</Text>
        </View>
        <MKButton style={[styles.textContainer, styles.rightElement]}>
          <Icon name="md-more" size={30} color="#aaa"/>
        </MKButton>
      </MKButton>
    )
  }

  _renderSectionHeader = (data, id) => {
    if (id === 'Needs Uploading') {
      return (
        <View style={[styles.headerContainer, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
          <Text style={styles.headerText}>{id}</Text>
          <MKButton style={{...(new Elevation(2)), backgroundColor: Colors.warning, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 2}} onPress={this._uploadAll.bind(this)}>
            <Text style={[styles.headerText, {color: Colors.warningText}]}>Upload All</Text>
          </MKButton>
        </View>
      )
    }
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{id}</Text>
      </View>
    )
  }

  _renderList = () => {
    return (
      <ListView
        dataSource={this.state.submissions}
        renderRow={this._renderRow}
        renderSectionHeader={this._renderSectionHeader}
        enableEmptySections={true}
      />
    )
  }

  _renderEmpty = () => {
    return (
      <View style={styles.centerContainer}>
        <Icon name="ios-albums-outline" size={120} style={styles.emptyListIcon}/>
        <Text style={styles.emptyListText}>
          You have not submitted any entries yet. You can
          start by going back and selecting a plant.
        </Text>
      </View>
    )
  }

  _goToEntryScene = (plant) => {
    this.props.navigator.push({
      label: 'ObservationScene',
      plant
    })
  }

  _uploadAll() {
    let observations = realm.objects('Submission').filtered('synced == false')
    observations.forEach(observation => {
      Observation.upload(observation).then(response => {
        // TODO: Add snackbar notification
        console.log(response)
        realm.write(() => {
          observation.synced = true
          this.setState({
            submissions: this.dataSource.cloneWithRowsAndSections(this._createMap(realm.objects('Submission')))
          })
        })
      }).catch(error => {
        // TODO: Handle Error!
        console.log(error)
      })
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Header navigator={this.props.navigator} title="Your Entries"/>
        {this.state.hasData ? this._renderList() : this._renderEmpty()}
      </View>
    )
  }
}

ObservationsScene.PropTypes = {
  navigator: PropTypes.object.isRequired
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: '#f7f7f7'
  },

  row: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding          : 10
  },

  image: {
    flex      : 0,
    width     : 50,
    height    : 50,
    resizeMode: 'cover'
  },

  textContainer: {
    flex             : 1,
    paddingHorizontal: 10,
    justifyContent   : 'space-between'
  },

  title: {
    color     : '#222',
    fontWeight: '500'
  },

  body: {
    color: '#666'
  },

  actionButton: {
    backgroundColor  : Colors.danger,
    borderRadius     : 2,
    paddingHorizontal: 5,
    paddingVertical  : 10
  },

  rightElement: {
    flex          : 0,
    width         : 50,
    alignItems    : 'center',
    justifyContent: 'center'
  },

  centerContainer: {
    ...(new Elevation(1)),
    flex           : 0,
    justifyContent : 'flex-start',
    alignItems     : 'center',
    padding        : 10,
    backgroundColor: '#fff',
    margin         : 10
  },

  emptyListText: {
    fontSize  : 16,
    fontWeight: '500',
    color     : '#222'
  },

  emptyListIcon: {
    marginBottom: 20,
    color       : '#444'
  },

  headerContainer: {
    padding          : 10,
    backgroundColor  : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },

  headerText: {
    color     : '#111',
    fontWeight: '500'
  }
})