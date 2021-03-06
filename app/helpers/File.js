import React from 'react'
import {DeviceEventEmitter, Platform} from 'react-native'
import ImageResizer from 'react-native-image-resizer'
import FS from 'rn-fetch-blob'
import realm from '../db/Schema'

export default class File {
  constructor() {
    this._system        = FS.fs
    this._imagesDir     = `${this._system.dirs.DocumentDir}/images`
    this._thumbnailsDir = `${this._system.dirs.DocumentDir}/thumbnails`
    this._processed     = 0
    this._images        = {}
    this._android       = Platform.OS === 'android'

    this._setup()
  }

  /**
   * Setup filesystem directories for images and thumbnails if they don't exist.
   *
   * @private
   */
  _setup() {
    this.isDirectory(this._imagesDir).then(exists => {
      if (exists) {
        return
      }

      this._system.mkdir(this._imagesDir).then(() => {
        // Done
      }).catch(error => {
        console.log(error)
      })
    })

    this.isDirectory(this._thumbnailsDir).then(exists => {
      if (exists) {
        return
      }

      this._system.mkdir(this._thumbnailsDir).then(() => {
        // Done
      }).catch(error => {
        console.log(error)
      })
    })
  }

  /**
   * Check if file exists.
   *
   * @param file
   * @returns {Promise.<bool>}
   */
  async exists(file) {
    return await this._system.exists(file)
  }

  /**
   * Check if file path is a directory.
   *
   * @param file
   * @returns {Promise.<bool>}
   */
  async isDirectory(file) {
    return await this._system.isDir(file)
  }

  /**
   * Copy files.
   *
   * @param from original file path
   * @param to new copy path
   * @param callback Function to call on success
   */
  copy(from, to, callback) {
    this._system.cp(from, to).then(() => {
      if (typeof  callback !== 'undefined') {
        callback()
      }
    }).catch(error => {
      console.log('Could not copy file ' + from + ': ', error)
    })
  }

  /**
   * Copy files with a Promise.
   *
   * @param from original file path
   * @param to new copy path
   *
   * @return {Promise<*>}
   */
  async copyAsync(from, to) {
    return await this._system.cp(from, to)
  }

  /**
   * Delete file.
   *
   * @param {string|array|object} file File path to delete
   * @param {function} callback (Optional) Function to call on success
   */
  delete(file, callback) {
    let count     = 0
    let processed = 0

    if (typeof file === 'string') {
      file = this.image(file)

      this._system.unlink(file.replace('file:', '')).then(() => {
        if (typeof  callback !== 'undefined') {
          callback()
        }
      }).catch(error => {
        if (typeof  callback !== 'undefined') {
          callback()
        }
        console.log('Could not delete file ' + file + ': ', error)
      })

      return
    }

    if (typeof file === 'object') {
      let keys = Object.keys(file)

      // We need a count to know if there is anything to delete
      keys.map(key => {
        count += file[key].length
      })

      if (count === 0) {
        typeof callback !== 'undefined' && callback()
        return
      }

      keys.map(key => {
        if (!Array.isArray(file[key])) {
          return
        }

        file[key].map(f => {
          f = this.image(f)
          // Increment the count.
          this._system.unlink(f.replace('file:', '')).then(() => {
            this._deleteThumbnail(f)
            // Increment the number of deleted items.
            processed++
            // If all files have been deleted, run the callback.
            if (processed === count && typeof callback !== 'undefined') {
              callback()
            }
          }).catch(error => {
            // We still want the number of deleted items increased even in failure because
            // we will never execute the callback if we fail.
            processed++
            console.log(error)
          })
        })
      })
    }
  }

  async deleteAsync(file) {
    let exists = await this.exists(file)
    if (!exists) {
      return
    }

    return await this._system.unlink(file)
  }

  /**
   * Delete thumbnail.
   *
   * @param file
   * @private
   */
  _deleteThumbnail(file) {
    let thumbnail = this.thumbnail(file)

    this.exists(thumbnail).then(exists => {
      if (!exists) {
        return
      }

      this._system.unlink(thumbnail.replace('file:', '')).then(() => {
        // nothing to do here
      }).catch(error => {
        console.log('couldn\'t delete thumbnail', error)
      })
    })
  }

  /**
   * Move file.
   *
   * @param from file path to move
   * @param to new path to move to
   * @param callback Function to call on success
   */
  move(from, to, callback) {
    this.exists(from.replace('file:')).then(exists => {
      if (!exists) {
        return
      }

      this._system.mv(from, to).then(() => {
        if (typeof  callback !== 'undefined') {
          callback()
        }
      }).catch(error => {
        console.log('Could not move file from ' + from + ' to ' + to + ': ', error)
      })
    }).catch(error => {
      console.log(error)
    })
  }

  async moveAsync(from, to) {
    let exists = this.exists(from)
    if (!exists) {
      throw new Error(`Failed to move file from ${from}. File does not exist`)
    }
    return this._system.mv(from, to)
  }

  /**
   * Download all images for an observation. This function will only download images
   * that haven't been downloaded previously.
   *
   * @param observation
   */
  download(observation) {
    let images    = JSON.parse(observation.images)
    let keys      = Object.keys(images)
    let count     = 0
    let processed = 0

    keys.map(key => {
      count += images[key].length
    })

    keys.map(key => {
      images[key].map((link, index) => {
        if (link.indexOf('http') === -1) {
          processed++
          return
        }

        this._setupImage(link, (image) => {
          processed++
          images[key][index] = image
          if (processed === count) {
            realm.write(() => {
              observation.images = JSON.stringify(images)
            })
          }
        })
      })
    })
  }

  /**
   * Fetch image form server.
   *
   * @param image
   * @return {Promise.<void>}
   */
  async downloadImage(image) {
    if (__DEV__ && Platform.OS === 'android') {
      image = image.replace('treesnap.test', '10.0.2.2:3000')
    }

    try {
      let response = await FS.config({fileCache: true}).fetch('GET', image)
      return response.path()
    } catch (error) {
      console.log('Error downloading image, ' + image)
    }
  }

  /**
   * Resize a list of images.
   *
   * @param {Object} images Object of images to process
   * @param {Object} processedImages Object of images to ignore. Helpful when editing to detect
   *                                  images that have already been processed previously
   *
   * @param images
   */
  resizeImages(images, processedImages) {
    let total       = 0
    this._processed = 0
    this._images    = images

    // Calculate the number of images in the array
    Object.keys(images).map(key => {
      total += images[key].length
    })

    // Deal with empty images object
    if (total === 0) {
      DeviceEventEmitter.emit('imagesResized', this._images)
    }

    Object.keys(images).map(key => {
      images[key].map((image, index) => {
        // Detect images that are already processed.
        if (typeof processedImages[key] !== 'undefined') {
          if (processedImages[key].indexOf(image) > -1) {
            this._processed++
            if (this._processed === total) {
              DeviceEventEmitter.emit('imagesResized', this._images)
            }
            return
          }
        }

        this._setupImage(image, new_image => {
          this._images[key][index] = new_image
          this.delete(image)
          this._processed++
          if (this._processed === total) {
            DeviceEventEmitter.emit('imagesResized', this._images)
          }
        })
      })
    })
  }

  /**
   * Get the real path to the image.
   *
   * @param image Path to the image
   * @returns {string}
   */
  image(image) {
    if (typeof image !== 'string') {
      return
    }

    if (image.indexOf('http') > -1) {
      return image
    }

    if (image.indexOf('/images/') === -1) {
      return image
    }

    // Get image name
    let name = image.split('/')
    name     = name[name.length - 1]

    let prefix = this._android ? 'file:' : ''

    return `${prefix}${this._imagesDir}/${name}`
  }

  /**
   * Get the thumbnail path.
   *
   * @param image Path to the image
   * @returns {string}
   */
  thumbnail(image) {
    if (typeof image !== 'string') {
      return
    }

    if (image.indexOf('http') > -1) {
      return image
    }

    if (image.indexOf('/images/') === -1) {
      return image
    }

    // Get image name
    let name = image.split('/')
    name     = name[name.length - 1]

    let prefix = this._android ? 'file:' : ''

    return `${prefix}${this._thumbnailsDir}/${name}`
  }

  /**
   * Resize image to create thumbnail.
   *
   * @param image path to image
   * @param callback (image, thumbnail) gets called on success
   * @private
   */
  async _setupImage(image, callback) {
    if (image.indexOf('http') > -1) {
      try {
        let path = await this.downloadImage(image)
        this._moveImage(path, image, callback)
      } catch (error) {
        console.log('Download error: ', error, image)
      }
      return
    }

    this._moveImage(image, image, callback)
  }

  _moveImage(image, link, callback) {
    // Get image name
    let name = link.split('/')
    name     = name[name.length - 1]

    let path = `${this._imagesDir}/${name}`

    this.copy(image.replace('file://', ''), path, () => {
      this._setupThumbnail(path)

      if (typeof  callback === 'function') {
        callback(path)
      }
    })

    return path
  }

  /**
   * Resize thumbnail.
   *
   * @param {string} image
   * @param {function} callback
   * @private
   */
  _setupThumbnail(image, callback) {
    // Get image name
    let name = image.split('/')
    name     = name[name.length - 1]

    // if (this._android) {
    //image = 'file:/' + image
    // }

    ImageResizer.createResizedImage(image, 160, 160, 'JPEG', 100, 0, this._thumbnailsDir)
      .then(({uri}) => {
        // Let it have the same name of the original image
        this.move(uri.replace('file:', ''), `${this._thumbnailsDir}/${name}`, callback)
      })
      .catch((error) => {
        console.log('Unable to create thumbnail: ', error, image)
      })
  }


  async generateThumbnails(images) {
    let keys = Object.keys(images)
    if (keys.length < 1) {
      return false
    }

    try {
      for (let key in keys) {
        for (let i in images[key]) {
          if (!images[key].hasOwnProperty(i)) {
            continue
          }

          let image = images[key][i]

          // Get image name
          let name = image.split('/')
          name     = name[name.length - 1]

          let {uri}   = await ImageResizer.createResizedImage(image, 160, 160, 'JPEG', 100, 0, this._thumbnailsDir)
          let newPath = `${this._thumbnailsDir}/${name}`
          await this.moveAsync(uri.replace('file:', ''), newPath)
        }
      }

      return true
    } catch (e) {
      console.log('Unable to create thumbnail: ', e, image)
    }
  }
}
