import React, {Component, PropTypes} from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import {MKSlider} from 'react-native-material-kit'
import Colors from '../helpers/Colors'

export default class SliderPick extends Component {
  constructor(props) {
    super(props)

    this.state = {
      value: 0
    }
  }

  componentDidMount() {
    this.onChange(this.props.start)
  }

  onChange = (curValue) => {
    let value = Math.round(curValue)
    this.setState({value})
    this.props.onChange(value)
  }

  render() {
    return (
        <View style={styles.container}>
          <MKSlider
            min={this.props.min}
            max={this.props.max}
            value={this.state.value}
            style={styles.slider}
            lowerTrackColor={Colors.primary}
            onChange={(value) => this.onChange(value)}
          />
          <TouchableOpacity style={styles.container}>
          <Text style={styles.label}>{this.state.value} {this.props.legendText}</Text>
          <Icon name="help-circle" style={styles.icon}/>
          </TouchableOpacity>
        </View>
    )
  }
}

SliderPick.propTypes = {
  min       : PropTypes.number,
  max       : PropTypes.number,
  start     : PropTypes.number,
  legendText: PropTypes.string,
  onChange  : PropTypes.func,
  description : PropTypes.string
}

SliderPick.defaultProps = {
  min       : 1,
  max       : 50,
  start     : 25,
  legendText: "Inches",
  onChange  : () => {
  }
}

const styles = StyleSheet.create({
  slider: {
    flex: 1
  },

  container: {
    flex         : 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  icon: {
    flex    : 0,
    width   : 30,
    fontSize: 20,
    color   : Colors.info
  },

  label: {
    flex: 0,
    color      : '#666',
    paddingRight: 10,
    fontSize   : 12,
    width: 74
  }
})