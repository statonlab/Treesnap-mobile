import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet,
  Platform
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import {isIphoneX} from 'react-native-iphone-x-helper'
import Elevation from '../helpers/Elevation'
import Colors from '../helpers/Colors'

export default class Header extends Component {
  constructor(props) {
    super(props)

    this.state = {
      menuIcon: 'menu'
    }

    this.listeners = []
  }

  componentWillUnmount() {
    this.listeners.map((event) => event.remove())
  }

  back = () => {
    if (!this.props.onBackPress()) {
      return
    }

    this.props.navigator.goBack()
  }

  getLeftIcon = () => {
    if (!this.props.showLeftIcon) {
      return <View style={[style.touchable, {width: 50, height: 55}]}/>
    }

    if (this.props.initial && Platform.OS !== 'android') {
      return <View style={[style.touchable, {width: 50}]}/>
    }

    if (this.props.initial && Platform.OS === 'android') {
      return (
        <TouchableHighlight style={[style.touchable, {paddingLeft: 10}]}
                            onPress={this.onMenuPress}
                            underlayColor={Colors.primary}>
          <Icon name={this.state.menuIcon} style={{fontSize: 25}} color="#fff"/>
        </TouchableHighlight>
      )
    } else if (!this.props.initial) {
      return (
        <TouchableHighlight style={style.touchable} onPress={this.back}
                            underlayColor={Colors.primary}>
          <Icon name="chevron-left" size={25} color="#fff"/>
        </TouchableHighlight>
      )
    }
  }

  getRightIcon = () => {
    let icon    = (<View style={{width: 50}}/>)

    if (!this.props.showRightIcon) {
      return icon
    }

    let onPress = this.navigateToMap

    if (this.props.rightIcon !== null) {
      icon    = this.props.rightIcon
      onPress = this.props.onRightPress

      if (icon === 'help') {
        icon = <Icon name={'help-circle'} size={23} color={'#fff'}/>
      }
    }

    return (
      <TouchableHighlight style={style.touchable}
                          underlayColor={Colors.primary}
                          onPress={onPress}>
        {icon}
      </TouchableHighlight>
    )
  }

  navigateToMap = () => {
    this.props.navigator.navigate('Map')
  }

  onMenuPress = () => {
    this.props.onMenuPress()
  }

  render() {
    let alignItems = 'center'
    if (Platform.OS === 'android') {
      alignItems = (this.props.showLeftIcon ? 'flex-start' : 'center')
    }

    return (
      <View style={[style.wrapper, {...new Elevation(this.props.elevation)}]}>
        {this.getLeftIcon()}

        <View
          style={[style.titleContainer, {
            alignItems
          }]}>
          <Text style={[style.text, style.title]} numberOfLines={1}>{this.props.title}</Text>
        </View>

        {this.getRightIcon()}
      </View>
    )
  }
}

Header.propTypes = {
  title        : PropTypes.string.isRequired,
  navigator    : PropTypes.object.isRequired,
  initial      : PropTypes.bool,
  onMenuPress  : PropTypes.func,
  elevation    : PropTypes.number,
  showLeftIcon : PropTypes.bool,
  showRightIcon: PropTypes.bool,
  onBackPress  : PropTypes.func,
  rightIcon    : PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onRightPress : PropTypes.func
}

Header.defaultProps = {
  initial      : false,
  onMenuPress  : () => {

  },
  onBackPress() {
    return true
  },
  onRightPress() {

  },
  elevation    : 3,
  showLeftIcon : true,
  showRightIcon: true,
  rightIcon    : null
}

function getVerticalPadding() {
  if (Platform.OS === 'android') {
    return 0
  } else {
    if (isIphoneX()) {
      return 30
    }
    return 15
  }
}

const style = StyleSheet.create({
  wrapper: {
    paddingTop     : getVerticalPadding(),
    flex           : 0,
    flexDirection  : 'row',
    backgroundColor: Colors.primary,
    zIndex         : 1000,
    alignItems     : 'center',
    justifyContent : 'center'
  },

  titleContainer: {
    flex: 1
  },

  title: {
    flex           : 0,
    paddingVertical: 15
  },

  text: {
    color     : Colors.primaryText,
    fontSize  : 18,
    fontWeight: '600'
  },

  right: {
    textAlign: 'right'
  },

  touchable: {
    flex             : 0,
    paddingHorizontal: 10,
    paddingVertical  : 15,
    marginTop        : 3
  }
})
