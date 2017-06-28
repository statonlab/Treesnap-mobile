import React, {Component, PropTypes} from 'react'
import {
  View,
  Image,
  StyleSheet,
  Text,
  ScrollView
} from 'react-native'
import {getTheme} from 'react-native-material-kit'
import Header from '../components/Header'
import Elevation from '../helpers/Elevation'
import Colors from '../helpers/Colors'
import {MKButton} from 'react-native-material-kit'
import Plants from '../resources/descriptions'
import ImageModal from '../components/ImageModal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

const theme = getTheme()

export default class TreeDescriptionScene extends Component {

  constructor(props) {
    super(props)
  }

  _renderImageModalIcons() {
    if (Plants[this.props.title].images.length === 0 && Plants[this.props.title].maps.length === 0) {
      return (
        <View style={{marginBottom: 5}}/>
      )
    }

    return (
      <View style={[styles.card, styles.iconsContainer]}>
        {Plants[this.props.title].images.length > 0 ?
          <ImageModal images={Plants[this.props.title].images} captions={Plants[this.props.title].captions} style={styles.buttonAlt} containerStyle={{flex: 1, paddingHorizontal: 5}}>
            <Icon name="camera-burst" size={23} style={styles.icon}/>
          </ImageModal>
          : null }
        {Plants[this.props.title].maps.length > 0 ?
          <ImageModal images={Plants[this.props.title].maps} style={styles.buttonAlt} containerStyle={{flex: 1, paddingHorizontal: 5}}>
            <Icon name="map" size={23} style={styles.icon}/>
          </ImageModal>
          : null }
      </View>
    )
  }

  render() {
    const len = Plants[this.props.title].descriptionCards.length - 1

    return (
      <View style={styles.container}>
        <Header
          title={this.props.title}
          navigator={this.props.navigator}
        />
        <ScrollView style={styles.scrollView}>
          <Image source={Plants[this.props.title].image} style={styles.cardImage}/>
          {this._renderImageModalIcons()}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => {
              this.props.navigator.push({label: 'FormScene', title: this.props.title, formProps: Plants[this.props.title].formProps})
            }}>
              <Text style={styles.buttonText}>
                Add New Entry
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {Plants[this.props.title].descriptionCards.map((card, index) => {
              return (
                <View key={index} style={[styles.cardBody, {borderBottomWidth: len === index ? 0 : 1}]}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  {card.body.map((body, bodyIndex) => {
                    return (
                      <Text style={styles.cardText} key={bodyIndex}>{body}</Text>
                    )
                  })}
                </View>
              )
            })}
          </View>
        </ScrollView>
      </View>
    )
  }
}

TreeDescriptionScene.propTypes = {
  title    : PropTypes.string.isRequired,
  navigator: PropTypes.object.isRequired
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    flex           : 1,
    flexDirection  : 'column'
  },

  scrollView: {
    flex: 1
  },

  iconsContainer: {
    paddingVertical  : 5,
    paddingHorizontal: 5,
    alignItems       : 'center',
    justifyContent   : 'space-between',
    flexDirection    : 'row'
  },

  icon: {
    color: '#666'
  },

  buttonAlt: {
    borderRadius   : 2,
    height         : 40,
    flex           : 1,
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: '#fff'
  },

  card: {
    borderTopWidth   : 1,
    borderTopColor   : '#ddd',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor  : '#fff',
    borderRadius     : 0,
    flex             : 1,
    paddingHorizontal: 10,
    justifyContent   : 'center',
    marginBottom     : 5
  },

  cardImage: {
    ...theme.cardImageStyle,
    height         : 150,
    resizeMode     : 'cover',
    width          : undefined,
    backgroundColor: '#fff'
  },

  cardTitle: {
    fontSize  : 14,
    flex      : 1,
    fontWeight: 'bold',
    color     : '#333'
  },

  cardBody: {
    paddingTop       : 15,
    paddingBottom    : 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },

  cardText: {
    fontSize       : 14,
    paddingVertical: 8,
    paddingLeft    : 10,
    paddingRight   : 5,
    color          : '#333',
    lineHeight     : 21
  },

  buttonContainer: {
    justifyContent: 'center',
    alignItems    : 'center',
    marginBottom  : 5
  },

  button: {
    ...(new Elevation(1)),
    borderRadius     : 2,
    backgroundColor  : Colors.primary,
    paddingHorizontal: 10,
    paddingVertical  : 15,
    width            : 300,
    maxWidth         : 300
  },

  buttonText: {
    textAlign : 'center',
    color     : '#fff',
    fontWeight: 'bold'
  }
})
