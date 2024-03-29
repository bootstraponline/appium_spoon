"use strict";

var errors = require('../../server/errors.js')
  , _ = require('underscore')
  , logger = require('../../server/logger.js').get('appium')
  , deviceCommon = require('../common.js')
  , helpers = require('../../helpers.js')
  , status = require('../../server/status.js')
  , NotYetImplementedError = errors.NotYetImplementedError
  , fs = require('fs')
  , temp = require('temp')
  , async = require('async')
  , mkdirp = require('mkdirp')
  , path = require('path')
  , AdmZip = require("adm-zip")
  , prettyExec = require('appium-adb/lib/helpers').prettyExec;

var androidController = {};

androidController.pressKeyCode = function (keycode, metastate, cb) {
  this.proxy(["pressKeyCode", {keycode: keycode, metastate: metastate}], cb);
};

androidController.longPressKeyCode = function (keycode, metastate, cb) {
  this.proxy(["longPressKeyCode", {keycode: keycode, metastate: metastate}], cb);
};

androidController.keyevent = function (keycode, metastate, cb) {
  helpers.logDeprecationWarning('function', 'keyevent', 'pressKeyCode');
  this.pressKeyCode(keycode, metastate, cb);
};

androidController.findElement = function (strategy, selector, cb) {
  this.findUIElementOrElements(strategy, selector, false, "", cb);
};

androidController.findElements = function (strategy, selector, cb) {
  this.findUIElementOrElements(strategy, selector, true, "", cb);
};

androidController.findUIElementOrElements = function (strategy, selector, many, context, cb) {
  if (!deviceCommon.checkValidLocStrat(strategy, false, cb)) {
    return;
  }
  if (strategy === "xpath" && context) {
    return cb(new Error("Cannot use xpath locator strategy from an element. " +
                        "It can only be used from the root element"));
  }
  var params = {
    strategy: strategy
  , selector: selector
  , context: context
  , multiple: many
  };

  var doFind = function (findCb) {
    this.proxy(["find", params], function (err, res) {
      this.handleFindCb(err, res, many, findCb);
    }.bind(this));
  }.bind(this);
  this.implicitWaitForCondition(doFind, cb);
};

androidController.handleFindCb = function (err, res, many, findCb) {
  if (err) {
    findCb(false, err, res);
  } else {
    if (!many && res.status === 0 && res.value !== null) {
      findCb(true, err, res);
    } else if (many && typeof res.value !== 'undefined' && res.value.length > 0) {
      findCb(true, err, res);
    } else {
      findCb(false, err, res);
    }
  }
};

androidController.findElementFromElement = function (element, strategy, selector, cb) {
  this.findUIElementOrElements(strategy, selector, false, element, cb);
};

androidController.findElementsFromElement = function (element, strategy, selector, cb) {
  this.findUIElementOrElements(strategy, selector, true, element, cb);
};

androidController.setValueImmediate = function (elementId, value, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.setValue = function (elementId, value, cb) {
  var params = {
    elementId: elementId,
    text: value,
    replace: false
  };
  if (this.args.unicodeKeyboard) {
    params.unicodeKeyboard = true;
  }
  this.proxy(["element:setText", params], cb);
};

androidController.replaceValue = function (elementId, value, cb) {
  var params = {
    elementId: elementId,
    text: value,
    replace: true
  };
  if (this.args.unicodeKeyboard) {
    params.unicodeKeyboard = true;
  }
  this.proxy(["element:setText", params], cb);
};

androidController.click = function (elementId, cb) {
  this.proxy(["element:click", {elementId: elementId}], cb);
};

androidController.touchLongClick = function (elementId, x, y, duration, cb) {
  var opts = {};
  if (elementId) opts.elementId = elementId;
  if (x) opts.x = x;
  if (y) opts.y = y;
  if (duration) opts.duration = duration;
  this.proxy(["element:touchLongClick", opts], cb);
};

androidController.touchDown = function (elementId, x, y, cb) {
  var opts = {};
  if (elementId) opts.elementId = elementId;
  if (x) opts.x = x;
  if (y) opts.y = y;
  this.proxy(["element:touchDown", opts], cb);
};

androidController.touchUp = function (elementId, x, y, cb) {
  var opts = {};
  if (elementId) opts.elementId = elementId;
  if (x) opts.x = x;
  if (y) opts.y = y;
  this.proxy(["element:touchUp", opts], cb);
};

androidController.touchMove = function (elementId, x, y, cb) {
  var opts = {};
  if (elementId) opts.elementId = elementId;
  if (x) opts.x = x;
  if (y) opts.y = y;
  this.proxy(["element:touchMove", opts], cb);
};

androidController.complexTap = function (tapCount, touchCount, duration, x, y, elementId, cb) {
  this.proxy(["click", {x: x, y: y}], cb);
};

androidController.clear = function (elementId, cb) {
  this.proxy(["element:clear", {elementId: elementId}], cb);
};

androidController.submit = function (elementId, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.getName = function (elementId, cb) {
  var p = {elementId: elementId, attribute: "className"};
  this.proxy(["element:getAttribute", p], cb);
};

androidController.getText = function (elementId, cb) {
  this.proxy(["element:getText", {elementId: elementId}], cb);
};

androidController.getAttribute = function (elementId, attributeName, cb) {
  var p = {elementId: elementId, attribute: attributeName};
  this.proxy(["element:getAttribute", p], cb);
};

androidController.getLocation = function (elementId, cb) {
  this.proxy(["element:getLocation", {elementId: elementId}], cb);
};

androidController.getSize = function (elementId, cb) {
  this.proxy(["element:getSize", {elementId: elementId}], cb);
};

androidController.getWindowSize = function (windowHandle, cb) {
  this.proxy(["getDeviceSize"], cb);
};

androidController.back = function (cb) {
  this.proxy(["pressBack"], cb);
};

androidController.forward = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.refresh = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.getPageIndex = function (elementId, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.keys = function (keys, cb) {
  var params = {
    text: keys,
    replace: false
  };
  if (this.args.unicodeKeyboard) {
    params.unicodeKeyboard = true;
  }
  this.proxy(['setText', params], cb);
};

androidController.frame = function (frame, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.implicitWait = function (ms, cb) {
  this.implicitWaitMs = parseInt(ms, 10);
  logger.debug("Set Android implicit wait to " + ms + "ms");
  cb(null, {
    status: status.codes.Success.code
  , value: null
  });
};

androidController.asyncScriptTimeout = function (ms, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.pageLoadTimeout = function (ms, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.executeAsync = function (script, args, responseUrl, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.elementDisplayed = function (elementId, cb) {
  var p = {elementId: elementId, attribute: "displayed"};
  this.proxy(["element:getAttribute", p], function (err, res) {
    if (err) return cb(err);
    var displayed = res.value === 'true';
    cb(null, {
      status: status.codes.Success.code
    , value: displayed
    });
  });
};

androidController.elementEnabled = function (elementId, cb) {
  var p = {elementId: elementId, attribute: "enabled"};
  this.proxy(["element:getAttribute", p], function (err, res) {
    if (err) return cb(err);
    var enabled = res.value === 'true';
    cb(null, {
      status: status.codes.Success.code
    , value: enabled
    });
  });
};

androidController.elementSelected = function (elementId, cb) {
  var p = {elementId: elementId, attribute: "selected"};
  this.proxy(["element:getAttribute", p], function (err, res) {
    if (err) return cb(err);
    var selected = res.value === 'true';
    cb(null, {
      status: status.codes.Success.code
    , value: selected
    });
  });
};

androidController.getCssProperty = function (elementId, propertyName, cb) {
  cb(new NotYetImplementedError(), null);
};

var _getNodeClass = function (node) {
  var nodeClass = null;
  _.each(node.attributes, function (attr) {
    if (attr.name === "class") {
      nodeClass = attr.value;
    }
  });
  return nodeClass;
};

var _copyNodeAttributes = function (oldNode, newNode) {
  _.each(oldNode.attributes, function (attr) {
    newNode.setAttribute(attr.name, attr.value);
  });
};

// recursively annotate xml nodes. Update tag name to be Android UIElement class name. Add an "instance" identifier which increments for each class separately.
var _annotateXmlNodes = function (newDom, newParent, oldNode, instances) {
  if (!instances) {
    instances = {};
  }
  var newNode;
  var nodeClass = _getNodeClass(oldNode);
  if (nodeClass) {
    newNode = newDom.createElement(nodeClass);
    _copyNodeAttributes(oldNode, newNode);

    // we keep track of the number of instances of each className. We use these to create queries on the bootstrap side.
    if (!instances[nodeClass]) {
      instances[nodeClass] = 0;
    }
    newNode.setAttribute('instance', instances[nodeClass]++);
  } else {
    newNode = oldNode.cloneNode(false);
  }
  newParent.appendChild(newNode);
  if (oldNode.hasChildNodes()) {
    _.each(oldNode.childNodes, function (childNode) {
      _annotateXmlNodes(newDom, newNode, childNode, instances);
    });
  }
};

androidController.getPageSource = function (cb) {
  this.proxy(["source", {}], cb);
};

androidController.getAlertText = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.setAlertText = function (text, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.postAcceptAlert = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.postDismissAlert = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.lock = function (secs, cb) {
  this.adb.lock(function (err) {
    if (err) return cb(err);
    cb(null, {
      status: status.codes.Success.code
      , value: null
    });
  });
};

androidController.isLocked = function (cb) {
  this.adb.isScreenLocked(function (err, isLocked) {
    if (err) return cb(err);
    cb(null, {
      status: status.codes.Success.code
      , value: isLocked
    });
  });
};

androidController.pushUnlock = function (cb) {
  logger.debug("Pushing unlock helper app to device...");
  var unlockPath = path.resolve(__dirname, "..", "..", "..", "build",
      "unlock_apk", "unlock_apk-debug.apk");
  fs.stat(unlockPath, function (err) {
    if (err) {
      cb(new Error("Could not find unlock.apk; please run " +
          "'reset.sh --android' to build it."));
    } else {
      this.adb.install(unlockPath, false, cb);
    }
  }.bind(this));
};

androidController.unlock = function (cb) {
  this.adb.isScreenLocked(function (err, isLocked) {
    if (err) return cb(err);
    if (isLocked) {
      logger.info("Unlocking screen");
      var timeoutMs = 10000;
      var start = Date.now();
      var unlockAndCheck = function () {
        logger.debug("Screen is locked, trying to unlock");
        var onStart = function (err) {
          if (err) return cb(err);
          this.adb.isScreenLocked(function (err, isLocked) {
            if (err) return cb(err);
            if (!isLocked) {
              logger.debug("Screen is unlocked, continuing");
              return cb(null, {
                status: status.codes.Success.code
                , value: null
              });
            }
            if ((Date.now() - timeoutMs) > start) {
              return cb(new Error("Screen did not unlock"));
            } else {
              setTimeout(unlockAndCheck, 1000);
            }
          }.bind(this));
        }.bind(this);
        this.adb.startApp({
          pkg: "io.appium.unlock",
          activity: ".Unlock",
          action: "android.intent.action.MAIN",
          category: "android.intent.category.LAUNCHER",
          flags: "0x10200000"
        }, onStart);
      }.bind(this);
      unlockAndCheck();
    } else {
      logger.debug('Screen already unlocked, continuing.');
      return cb(null, {
        status: status.codes.Success.code
        , value: null
      });
    }
  }.bind(this));
};

androidController.equalsWebElement = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.getOrientation = function (cb) {
  this.proxy(["orientation", {}], cb);
};

androidController.setOrientation = function (orientation, cb) {
  this.proxy(["orientation", {orientation: orientation}], cb);
};

androidController.endCoverage = function (intentToBroadcast, ecOnDevicePath, cb) {
  var localfile = temp.path({prefix: 'appium', suffix: '.ec'});
  if (fs.existsSync(localfile)) fs.unlinkSync(localfile);
  var b64data = "";

  async.series([
    function (cb) {
      // ensure the ec we're pulling is newly created as a result of the intent.
      this.adb.rimraf(ecOnDevicePath, function () { cb(); });
    }.bind(this),
    function (cb) {
      this.adb.broadcastProcessEnd(intentToBroadcast, this.appProcess, cb);
    }.bind(this),
    function (cb) {
      this.adb.pull(ecOnDevicePath, localfile, cb);
    }.bind(this),
    function (cb) {
      fs.readFile(localfile, function (err, data) {
        if (err) return cb(err);
        b64data = new Buffer(data).toString('base64');
        cb();
      });
    }.bind(this),
  ],
  function (err) {
    if (fs.existsSync(localfile)) fs.unlinkSync(localfile);
    if (err) return cb(err);
    cb(null, {
      status: status.codes.Success.code
    , value: b64data
    });
  });
};

androidController.pullFile = function (remotePath, cb) {
  var localFile = temp.path({prefix: 'appium', suffix: '.tmp'});
  var b64data = "";

  async.series([
    function (cb) {
      this.adb.pull(remotePath, localFile, cb);
    }.bind(this),
    function (cb) {
      fs.readFile(localFile, function (err, data) {
        if (err) return cb(err);
        b64data = new Buffer(data).toString('base64');
        cb();
      });
    }.bind(this),
  ],
    function (err) {
      if (fs.existsSync(localFile)) fs.unlinkSync(localFile);
      if (err) return cb(err);
      cb(null, {
        status: status.codes.Success.code
      , value: b64data
      });
    });
};

androidController.pushFile = function (base64Data, remotePath, cb) {
  var localFile = temp.path({prefix: 'appium', suffix: '.tmp'});
  mkdirp.sync(path.dirname(localFile));

  async.series([
    function (cb) {
      var content = new Buffer(base64Data, 'base64');
      var fd = fs.openSync(localFile, 'w');
      fs.writeSync(fd, content, 0, content.length, 0);
      fs.closeSync(fd);

      // adb push creates folders and overwrites existing files.
      this.adb.push(localFile, remotePath, cb);
    }.bind(this),
  ],
    function (err) {
      if (fs.existsSync(localFile)) fs.unlinkSync(localFile);
      if (err) return cb(err);
      cb(null, {
        status: status.codes.Success.code
      });
    });
};

androidController.pullFolder = function (remotePath, cb) {
  var localFolder = temp.path({prefix: 'appium'});

  var bufferOnSuccess = function (buffer) {
    logger.debug("Converting in-memory zip file to base64 encoded string");
    var data = buffer.toString('base64');
    logger.debug("Returning in-memory zip file as base54 encoded string");
    cb(null, {status: status.codes.Success.code, value: data});
  };

  var bufferOnFail = function (err) {
    cb(new Error(err));
  };

  this.adb.pull(remotePath, localFolder, function (err) {
    if (err) return cb(new Error(err));
    var zip = new AdmZip();
    zip.addLocalFolder(localFolder);
    zip.toBuffer(bufferOnSuccess, bufferOnFail);
  });
};

androidController.getScreenshot = function (cb) {
  var localfile = temp.path({prefix: 'appium', suffix: '.png'});
  var b64data = "";

  async.series([
    function (cb) {
      var png = "/data/local/tmp/screenshot.png";
      var cmd =  ['"/system/bin/rm', png + ';', '/system/bin/screencap -p',
                  png, '"'].join(' ');
      this.adb.shell(cmd, cb);
    }.bind(this),
    function (cb) {
      if (fs.existsSync(localfile)) fs.unlinkSync(localfile);
      this.adb.pull('/data/local/tmp/screenshot.png', localfile, cb);
    }.bind(this),
    function (cb) {
      fs.readFile(localfile, function (err, data) {
        if (err) return cb(err);
        b64data = new Buffer(data).toString('base64');
        cb();
      });
    },
    function (cb) {
      fs.unlink(localfile, function (err) {
        if (err) return cb(err);
        cb();
      });
    }
  ],
  // Top level cb
  function (err) {
    if (err) return cb(err);
    cb(null, {
      status: status.codes.Success.code
    , value: b64data
    });
  });
};

androidController.fakeFlick = function (xSpeed, ySpeed, swipe, cb) {
  this.proxy(["flick", {xSpeed: xSpeed, ySpeed: ySpeed}], cb);
};

androidController.fakeFlickElement = function (elementId, xoffset, yoffset, speed, cb) {
  this.proxy(["element:flick", {xoffset: xoffset, yoffset: yoffset, speed: speed, elementId: elementId}], cb);
};

androidController.swipe = function (startX, startY, endX, endY, duration, touchCount, elId, cb) {
  if (startX === 'null') {
    startX = 0.5;
  }
  if (startY === 'null') {
    startY = 0.5;
  }
  var swipeOpts = {
    startX: startX
  , startY: startY
  , endX: endX
  , endY: endY
  , steps: Math.round(duration * this.swipeStepsPerSec)
  };

  // going the long way and checking for undefined and null since
  // we can't be assured `elId` is a string and not an int
  if (typeof elId !== "undefined" && elId !== null) {
    swipeOpts.elementId = elId;
    this.proxy(["element:swipe", swipeOpts], cb);
  } else {
    this.proxy(["swipe", swipeOpts], cb);
  }
};

androidController.rotate = function (x, y, radius, rotation, duration, touchCount, elId, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.pinchClose = function (startX, startY, endX, endY, duration, percent, steps, elId, cb) {
  var pinchOpts = {
    direction: 'in'
  , elementId: elId
  , percent: percent
  , steps: steps
  };
  this.proxy(["element:pinch", pinchOpts], cb);
};

androidController.pinchOpen = function (startX, startY, endX, endY, duration, percent, steps, elId, cb) {
  var pinchOpts = {
    direction: 'out'
  , elementId: elId
  , percent: percent
  , steps: steps
  };
  this.proxy(["element:pinch", pinchOpts], cb);
};

androidController.spoon = function (cb) {
  /*
   invoke spoon command

   java -jar spoon.jar --apk apk.apk --test-apk test-apk.apk

   respond with base64 encoded zip of spoon-output folder
   */
  var spoonJar = path.join(__dirname, 'spoon.jar');
  var apkPath = path.join(__dirname, 'apk.apk');
  var testApkPath = path.join(__dirname, 'test-apk.apk');
  prettyExec('java', ['-jar', spoonJar,
      '--apk', apkPath,
      '--test-apk', testApkPath],
    {maxBuffer: 524288}, function (err, stdout, stderr) {
      if (err) return cb(new Error(err));

      var bufferOnSuccess = function (buffer) {
        logger.debug("Converting in-memory zip file to base64 encoded string");
        var data = buffer.toString('base64');
        logger.debug("Returning in-memory zip file as base54 encoded string");
        cb(null, {status: status.codes.Success.code, value: data});
      };

      var bufferOnFail = function (err) {
        cb(new Error(err));
      };

      var zip = new AdmZip();
      zip.addLocalFolder('spoon-output');
      zip.toBuffer(bufferOnSuccess, bufferOnFail);
    });
};

androidController.flick = function (startX, startY, endX, endY, touchCount, elId, cb) {
  if (startX === 'null') {
    startX = 0.5;
  }
  if (startY === 'null') {
    startY = 0.5;
  }
  var swipeOpts = {
    startX: startX
  , startY: startY
  , endX: endX
  , endY: endY
  , steps: Math.round(0.2 * this.swipeStepsPerSec)
  };
  if (elId !== null) {
    swipeOpts.elementId = elId;
    this.proxy(["element:swipe", swipeOpts], cb);
  } else {
    this.proxy(["swipe", swipeOpts], cb);
  }
};

androidController.drag = function (startX, startY, endX, endY, duration, touchCount, elementId, destElId, cb) {
  var dragOpts = {
    elementId: elementId
  , destElId: destElId
  , startX: startX
  , startY: startY
  , endX: endX
  , endY: endY
  , steps: Math.round(duration * this.dragStepsPerSec)
  };

  if (elementId) {
    this.proxy(["element:drag", dragOpts], cb);
  } else {
    this.proxy(["drag", dragOpts], cb);
  }
};

androidController.scrollTo = function (elementId, text, direction, cb) {
  // instead of the elementId as the element to be scrolled too,
  // it's the scrollable view to swipe until the uiobject that has the
  // text is found.
  var opts = {
    text: text
  , direction: direction
  , elementId: elementId
  };
  this.proxy(["element:scrollTo", opts], cb);
};

androidController.scroll = function (direction, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.shake = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.setLocation = function (latitude, longitude, altitude, horizontalAccuracy, verticalAccuracy, course, speed, cb) {
  var cmd = "geo fix " + longitude + " " + latitude;
  this.adb.sendTelnetCommand(cmd, function (err, res) {
    if (err) {
      return cb(null, {
        status: status.codes.UnknownError.code
      , value: "Could not set geolocation via telnet to device"
      });
    }
    cb(null, {
      status: status.codes.Success.code
    , value: res
    });
  });
};

androidController.url = function (url, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.active = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.closeWindow = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.clearWebView = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.execute = function (script, args, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.convertElementForAtoms = deviceCommon.convertElementForAtoms;

androidController.title = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.moveTo = function (element, xoffset, yoffset, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.clickCurrent = function (button, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.getCookies = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.setCookie = function (cookie, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.deleteCookie = function (cookie, cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.deleteCookies = function (cb) {
  cb(new NotYetImplementedError(), null);
};

androidController.resetAndStartApp = function (cb) {
  async.series([
    this.resetApp.bind(this),
    this.waitForActivityToStop.bind(this),
    this.startAppUnderTest.bind(this)
  ], cb);
};

// controller.js#isAppInstalled expects weird response, hence this hack
androidController.isAppInstalled = function (appPackage, cb) {
  this.adb.isAppInstalled(appPackage, function (err, installed) {
    if (installed) {
      return cb(null, [true]);
    }
    cb(err, []);
  });
};

androidController.removeApp = function (appPackage, cb) {
  var removeCommand = null;
  if (this.args.udid) {
    removeCommand = 'adb -s ' + this.args.udid + ' uninstall ' + appPackage;
  } else {
    removeCommand = 'adb uninstall ' + appPackage;
  }
  deviceCommon.removeApp(removeCommand, this.args.udid, appPackage, cb);
};

androidController.installApp = function (appPath, cb) {
  var installationCommand = null;
  if (this.args.udid) {
    installationCommand = 'adb -s ' + this.args.udid + ' install ' + appPath;
  } else {
    installationCommand = 'adb install ' + appPath;
  }
  deviceCommon.installApp(installationCommand, this.args.udid, appPath, cb);
};

androidController.unpackApp = function (req, cb) {
  deviceCommon.unpackApp(req, '.apk', cb);
};

androidController.tap = function (elementId, x, y, count, cb) {
  if (typeof x === "undefined" || x === null) x = 0;
  if (typeof y === "undefined" || y === null) y = 0;
  if (typeof count === "undefined" || count === null) count = 1;

  var i = 0;
  var opts = {};
  var loop = function (err, res) {
    if (err) return cb(err);
    if (i++ >= count) return cb(err, res);

    this.proxy(opts, loop);
  }.bind(this);

  if (elementId) {
    // we are either tapping on the default location of the element
    // or an offset from the top left corner
    if (x !== 0 || y !== 0) {
      opts = ["element:click", {elementId: elementId, x: x, y: y}];
    } else {
      opts = ["element:click", {elementId: elementId}];
    }
    loop();
  } else {
    // we have absolute coordinates
    opts = ["click", {x: x, y: y}];
    loop();
  }
};

androidController.doTouchAction = function (action, opts, cb) {
  switch (action) {
    case 'tap':
      return this.tap(opts.element, opts.x, opts.y, opts.count, cb);
    case 'press':
      return this.touchDown(opts.element, opts.x, opts.y, cb);
    case 'release':
      return this.touchUp(opts.element, opts.x, opts.y, cb);
    case 'moveTo':
      return this.touchMove(opts.element, opts.x, opts.y, cb);
    case 'wait':
      return setTimeout(function () {
        cb(null, {"value": true, "status": status.codes.Success.code});
      }, opts.ms);
    case 'longPress':
      if (typeof opts.duration === 'undefined' || !opts.duration) {
        opts.duration = 1000;
      }
      return this.touchLongClick(opts.element, opts.x, opts.y, opts.duration, cb);
    case 'cancel':
      // TODO: clarify behavior of 'cancel' action and fix this
      logger.warn("Cancel action currently has no effect");
      break;
    default:
      return cb("unknown action '" + action + "'");
  }
};

androidController.performTouch = function (gestures, cb) {
  var actions = _.pluck(gestures, "action");

  // drag is *not* press-move-release, so we need to translate
  // drag works fine for scroll, as well
  var doTouchDrag = function (gestures, cb) {
    var getStartLocation = function (elementId, x, y, ncb) {
      var startX = x || 0
        , startY = y || 0;
      if (elementId) {
        this.getLocation(elementId, function (err, res) {
          if (err) return ncb(err);

          startX += res.value.x || 0;
          startY += res.value.y || 0;

          return ncb(null, startX, startY);
        }.bind(this));
      } else {
        return ncb(null, startX, startY);
      }
    }.bind(this);
    var getEndLocation = function (elementId, x, y, ncb) {
      var endX = x || 0
        , endY = y || 0;
      if (elementId) {
        this.getLocation(elementId, function (err, res) {
          if (err) return ncb(err);

          endX += res.value.x || 0;
          endY += res.value.y || 0;

          return ncb(null, endX, endY);
        }.bind(this));
      } else {
        return ncb(null, endX, endY);
      }
    }.bind(this);

    var longPress = gestures[0];
    getStartLocation(longPress.options.element, longPress.options.x, longPress.options.y, function (err, startX, startY) {
      if (err) return cb(err);

      var moveTo = gestures[1];
      getEndLocation(moveTo.options.element, moveTo.options.x, moveTo.options.y, function (err, endX, endY) {
        this.adb.getApiLevel(function (err, apiLevel) {
          // lollipop takes a little longer to get things rolling
          var duration = apiLevel >= 5 ? 2 : 1;
          // `drag` will take care of whether there is an element or not at that level
          return this.drag(startX, startY, endX, endY, duration, 1, longPress.options.element, moveTo.options.element, cb);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this);


  // Fix last release action
  var fixRelease = function (cb) {
    if (actions[actions.length - 1] === 'release') {
      var release = gestures[actions.length - 1];
      // sometimes there are no options
      release.options = release.options || {};

      // nothing to do if release options are already set
      if (release.options.element || (release.options.x && release.options.y)) return;

      // without coordinates, `release` uses the center of the screen, which,
      // generally speaking, is not what we want
      // therefore: loop backwards and use the last command with an element and/or
      // offset coordinates
      var ref = _(gestures).chain().initial().filter(function (gesture) {
        var opts = gesture.options;
        return opts.element || (opts.x && opts.y);
      }).last().value();
      if (ref) {
        var opts = ref.options || {};
        if (opts.element) {
          // we retrieve the element location, might be useful in
          // case the element becomes invalid
          return async.parallel([
            this.getLocation.bind(this, opts.element),
            this.getSize.bind(this, opts.element)
          ], function (err, res) {
            if (err) return cb(err);
            var loc = res[0].value, size = res[1].value;
            release.options = {
              element: opts.element,
              x: loc.x + size.width / 2,
              y: loc.y + size.height / 2
            };
            cb();
          });
        }
        if (opts.x && opts.y) release.options = _.pick(opts, 'x', 'y');
      }
    }
    cb();
  }.bind(this);

  // Perform one gesture
  var performGesture = function (gesture, cb) {
    async.waterfall([
      this.doTouchAction.bind(this, gesture.action, gesture.options || {}),
      function (res, cb) {
        // sometime the element is not available when releasing, retry without it
        if (res && res.status === 7 &&
           gesture.action === 'release' && gesture.options.element) {
           delete gesture.options.element;
           logger.debug('retrying release without element opts:', gestures.options, '.');
           return this.doTouchAction(gesture.action, gesture.options || {}, cb);
        }
        // otherwise continue normally
        return cb(null, res);
      }.bind(this)], function (err, res) {
        if (err) return cb(err);
        // check result, we wrap json errors
        if (res.status !== 0) {
          err = new Error();
          err.res = res;
          return cb(err);
        }
        cb(null, res);
      });
  }.bind(this);

  // wrapping callback
  cb = _.wrap(cb, function (cb, err) {
    if (err) {
      if (err.res) return cb(null, err.res);
      logger.error(err, err.stack);
      return cb(err);
    }
    // success
    cb(null, { value: true, status: 0 });
  });

  if (actions[0] === 'longPress' && actions[1] === 'moveTo' && actions[2] === 'release') {
    // some things are special
    doTouchDrag(gestures, cb);
  } else {
    // `press` without a wait is too slow and gets interpretted as a `longPress`
    if (actions[actions.length - 2] === 'press' && actions[actions.length - 1] === 'release') {
      actions[actions.length - 2] = 'tap';
      gestures[gestures.length - 2].action = 'tap';
    }

    // the `longPress` and `tap` methods release on their own
    if ((actions[actions.length - 2] === 'tap' ||
      actions[actions.length - 2] === 'longPress') && actions[actions.length - 1] === 'release') {
      gestures.pop();
      actions.pop();
    }

    // fix release action then perform all actions
    fixRelease(function (err) {
      if (err) return cb(err);
      this.parseTouch(gestures, false, function (err, fixedGestures) {
        if (err) return cb(err);
        async.eachSeries(fixedGestures, performGesture, cb);
      });
    }.bind(this));
  }
};

androidController.parseTouch = function (gestures, multi, cb) {
  if (multi && _.last(gestures).action === 'release') {
    gestures.pop();
  }

  var needsPoint = function (action) {
    return _.contains(['press', 'moveTo', 'tap', 'longPress'], action);
  };

  var touchStateObjects = [];
  async.eachSeries(gestures, function (gesture, done) {
    var options = gesture.options;
    if (needsPoint(gesture.action)) {
      options.offset = false;
      var elementId = gesture.options.element;
      if (elementId) {
        this.getLocation(elementId, function (err, res) {
          if (err) return done(err); // short circuit and quit

          var pos = { x: res.value.x, y: res.value.y };
          this.getSize(elementId, function (err, res) {
            if (err) return done(err);
            var size = {w: res.value.width, h: res.value.height};

            if (gesture.options.x || gesture.options.y) {
              options.x = pos.x + (gesture.options.x || 0);
              options.y = pos.y + (gesture.options.y || 0);
            } else {
              options.x =  pos.x + (size.w / 2);
              options.y = pos.y + (size.h / 2);
            }

            var touchStateObject = {
              action: gesture.action,
              options: options,
              timeOffset: 0.005,
            };
            touchStateObjects.push(touchStateObject);
            done();
          });
        }.bind(this));
      } else {
        // expects absolute coordinates, so we need to save these as offsets
        // and then translate when everything is done
        options.offset = true;
        options.x = (gesture.options.x || 0);
        options.y = (gesture.options.y || 0);

        touchStateObject = {
          action: gesture.action,
          options: options,
          timeOffset: 0.005,
        };
        touchStateObjects.push(touchStateObject);
        done();
      }
    } else {
      var offset = 0.005;
      if (gesture.action === 'wait') {
        options = gesture.options;
        offset = (parseInt(gesture.options.ms) / 1000);
      }
      var touchStateObject = {
        action: gesture.action,
        options: options,
        timeOffset: offset,
      };
      touchStateObjects.push(touchStateObject);
      done();
    }
  }.bind(this), function (err) {
    if (err) return cb(err);

    // we need to change the time (which is now an offset)
    // and the position (which may be an offset)
    var prevPos = null,
        time = 0;
    _.each(touchStateObjects, function (state) {
      if (typeof state.options.x === 'undefined' && typeof state.options.x === 'undefined') {
        // this happens with wait
        state.options.x = prevPos.x;
        state.options.y = prevPos.y;
      }
      if (state.options.offset && prevPos) {
        // the current position is an offset
        state.options.x += prevPos.x;
        state.options.y += prevPos.y;
      }
      delete state.options.offset;
      prevPos = state.options;

      if (multi) {
        var timeOffset = state.timeOffset;
        time += timeOffset;
        state.time = helpers.truncateDecimals(time, 3);

        // multi gestures require 'touch' rather than 'options'
        state.touch = state.options;
        delete state.options;
      }

      delete state.timeOffset;
    });

    cb(null, touchStateObjects);
  });
};

androidController.performMultiAction = function (elementId, actions, cb) {
  // Android needs at least two actions to be able to perform a multi pointer gesture
  if (actions.length === 1) {
    return cb(new Error("Multi Pointer Gestures need at least two actions. " +
                        "Use Touch Actions for a single action."));
  }

  var states = [];
  async.eachSeries(actions, function (action, done) {
    this.parseTouch(action, true, function (err, val) {
      if (err) return done(err);

      states.push(val);
      done();
    }.bind(this));
  }.bind(this), function (err) {
    if (err) return cb(err);

    var opts;
    if (elementId) {
      opts = {
        elementId: elementId,
        actions: states
      };
      return this.proxy(["element:performMultiPointerGesture", opts], cb);
    } else {
      opts = {
        actions: states
      };
      return this.proxy(["performMultiPointerGesture", opts], cb);
    }
  }.bind(this));
};

androidController.openNotifications = function (cb) {
  this.proxy(["openNotification"], cb);
};

androidController.getUrl = function (cb) {
  cb(new NotYetImplementedError(), null);
};

module.exports = androidController;
