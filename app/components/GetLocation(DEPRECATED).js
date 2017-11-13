import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  StyleSheet,
  View,
  Image,
  Text,
  DeviceEventEmitter
} from 'react-native'
import MapView from 'react-native-maps'
import {MKSpinner, TouchableOpacity, getTheme} from 'react-native-material-kit'
import Colors from '../helpers/Colors'
import Elevation from '../helpers/Elevation'

const theme = getTheme()

export default class GetLocation extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentPosition   : 'unknown',
      reachedMaxAccuracy: false,
      timeConsumed      : 0,
      done              : false
    }
  }

  componentDidMount() {
    this.getLocation()
    this.updateLocation()
  }

  updateLocation() {
    this.timeoutHolder = setTimeout(() => {
      if (!this.state.done) {
        this.getLocation()

        this.updateLocation()
      }
    }, 500)
  }

  getLocation() {
    navigator.geolocation.getCurrentPosition(
      this.setLocation.bind(this),
      (error) => console.log(JSON.stringify(error)),
      {
        enableHighAccuracy: true,
        timeout           : 20000,
        maximumAge        : 1000
      }
    )
  }

  setLocation(position) {
    this.latitude  = position.coords.latitude
    this.longitude = position.coords.longitude

    this.setState({
      currentPosition: position,
      timeConsumed   : this.state.timeConsumed + 500
    })

    // If accuracy reaches 10 meters, we are done
    if (parseInt(position.coords.accuracy) <= 10) {
      this.setState({
        reachedMaxAccuracy: true,
        done              : true
      })
    }

    // If 1 minute passes, accept location no matter the accuracy
    if ((this.state.timeConsumed / 1000) >= 60) {
      this.setState({done: true})
    }
  }

  async saveLocation(position) {
    await DeviceEventEmitter.emit('locationCaptured', {
      longitude: position.coords.longitude,
      latitude : position.coords.latitude,
      accuracy : position.coords.accuracy
    })
  }

  accept = () => {
    clearTimeout(this.timeoutHolder)
    this.saveLocation(this.state.currentPosition).then(this.props.accept)
  }

  cancel = () => {
    clearTimeout(this.timeoutHolder)
    this.props.cancel()
  }

  render() {
    return (
      <View {...this.props} style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardBody}>
            {!this.state.done &&
            <View style={[styles.cardMap, {justifyContent: 'center', alignItems: 'center'}]}>
              <MKSpinner prgress={.5} buffer={.5}></MKSpinner>
            </View>
            }

            {this.state.done &&
            <MapView
              style={styles.cardMap}
              region={{
               latitude: this.latitude,
               longitude: this.longitude,
               latitudeDelta : 0.0222,
               longitudeDelta: 0.0221
            }}>
              <MapView.Marker
                flat={true}
                coordinate={{
                 latitude: this.latitude,
                 longitude: this.longitude
              }}/>
            </MapView>
            }
          </View>
        </View>


        <View style={styles.card}>
          <View style={[styles.cardBody, {paddingVertical: 10}]}>
            {!this.state.done &&
            <View>
              <Text style={styles.text}>Attempting to Enhance Accuracy</Text>
              <Text style={[styles.text, {fontSize: 14}]}>This may take up to 1 minute</Text>
              <Text style={[styles.text, {fontWeight: 'bold'}]}>
                {typeof this.state.currentPosition == 'object' ? parseInt(this.state.currentPosition.coords.accuracy) : 'unknown'} meters
              </Text>
            </View>
            }

            {this.state.done &&
            <View>
              <Text style={[styles.text, {fontWeight: 'bold'}]}>Location Acquired</Text>
              <Text style={[styles.text, {fontSize: 14}]}>
                {this.state.currentPosition.coords.latitude},{this.state.currentPosition.coords.longitude}
              </Text>
              <Text style={[styles.text, {fontSize: 14, fontWeight: 'bold'}]}>
                Accuracy of {parseInt(this.state.currentPosition.coords.accuracy)} meters
              </Text>
            </View>
            }

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.button}
                onPress={this.accept}>
                <Text style={styles.buttonText}>Accept Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: "#eee"}]}
                onPress={this.cancel}>
                <Text style={[styles.buttonText, {color: "#666"}]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )
  }
}

GetLocation.propTypes = {
  ...View.propTypes,
  accept: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired
}

const styles = StyleSheet.create({
  container : {
    flex             : 1,
    paddingVertical  : 10,
    paddingHorizontal: 5
  },
  row       : {
    flexDirection : 'row',
    justifyContent: 'space-between'
  },
  button    : {
    padding        : 10,
    backgroundColor: Colors.primary,
    borderRadius   : 2,
    marginTop      : 10,
    ...(new Elevation(2))
  },
  buttonText: {
    color    : Colors.primaryText,
    textAlign: 'center'
  },
  card      : {
    ...theme.cardStyle,
    ...(new Elevation(2)),
    marginBottom: 15
  },
  cardImage : {
    ...theme.cardImageStyle,
    height         : 150,
    resizeMode     : 'cover',
    width          : undefined,
    borderRadius   : 3,
    backgroundColor: '#fff',
  },
  cardMap   : {
    height         : 200,
    borderRadius   : 3,
    backgroundColor: '#fff',
  },
  cardTitle : {
    ...theme.cardTitleStyle,
    fontSize: 14,
    flex    : 50,
    padding : 0,
    position: undefined,
    top     : 0,
    left    : 0
  },
  cardBody  : {
    padding: 5
  },
  text      : {
    textAlign   : 'center',
    fontSize    : 16,
    marginBottom: 10
  }
})