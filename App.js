import React, { Component } from 'react'
import {
  StatusBar,
  View,
  StyleSheet,
  DeviceEventEmitter,
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import Diagnostics from './app/helpers/Diagnostics'
import Actions from './app/helpers/Actions'
import SnackBarNotice from './app/components/SnackBarNotice'
import Navigator from './app/routes/Navigator'
import Observation from './app/helpers/Observation'
import WelcomeModal from './app/components/WelcomeModal'
import NotificationsController from './app/components/NotificationsController'
import ObservationLostImagesFixer from './app/components/ObservationLostImagesFixer'
import Geolocation from '@react-native-community/geolocation'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default class App extends Component {
  constructor(props) {
    super(props)

    Geolocation.setRNConfiguration({skipPermissionRequests: false})

    this.state = {
      snackMessage        : '',
      appReady            : false,
      requestNotifications: false,
    }

    this.events = []
  }

  componentDidMount() {
    this.initApp()

    this.events.push(DeviceEventEmitter.addListener('userLoggedIn', () => {
      if (this.snackbar) {
        this.setState({snackMessage: 'Logged in successfully!'})
        this.snackbar.showBar()
      }
      Observation.download()
    }))

    this.events.push(DeviceEventEmitter.addListener('userLoggedOut', () => {
      if (this.snackbar) {
        this.setState({snackMessage: 'Logged out successfully!'})
        this.snackbar.showBar()
      }
    }))
  }

  componentWillUnmount() {
    this.events.map(event => event.remove())
  }

  async initApp() {
    try {
      await Diagnostics.run()
    } catch (error) {
      console.log('HERE Unable to run diagnostics', error)
    }

    try {
      const actions = new Actions()
      await actions.run()
    } catch (error) {
      console.log(error)
    }

    await this.setAppOpenState()

    this.setState({appReady: true})
  }

  async setAppOpenState() {
    try {
      let firstOpen = await AsyncStorage.getItem('@appState:firstOpen')
      if (firstOpen !== 'yes') {
        await AsyncStorage.setItem('@appState:firstOpen', 'yes')
      }
    } catch (error) {
      console.log(error)
    }
  }

  render() {
    const prefix = Platform.select({
      ios    : 'treesnap://',
      android: 'treesnap://treesnap/',
    })

    return (
      <View style={styles.container}>
        <SafeAreaProvider>
          <StatusBar
            backgroundColor="#25897d"
            barStyle="light-content"
          />
          <WelcomeModal
            onLoginRequest={() => {
              DeviceEventEmitter.emit('loginRequest')
            }}
            onDone={() => {
              DeviceEventEmitter.emit('welcomeModalDone')
              this.setState({requestNotifications: true})
            }}
          />
          {this.state.appReady ?
            <ObservationLostImagesFixer/>
            : null}
          <Navigator uriPrefix={prefix}/>
          <SnackBarNotice
            topLevel={true}
            ref={(ref) => this.snackbar = ref} noticeText={this.state.snackMessage}/>
          {this.state.requestNotifications ?
            <NotificationsController onUploadRequest={() => {
              DeviceEventEmitter.emit('uploadRequested')
            }}/> : null}
        </SafeAreaProvider>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
