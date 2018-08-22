/**!
© 2016 Convergence Labs, Inc.
@version 0.1.1
@license MIT
*/
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _AceMultiSelectionManager = __webpack_require__(1);

	Object.defineProperty(exports, 'AceMultiSelectionManager', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_AceMultiSelectionManager).default;
	  }
	});

	var _AceMultiCursorManager = __webpack_require__(3);

	Object.defineProperty(exports, 'AceMultiCursorManager', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_AceMultiCursorManager).default;
	  }
	});

	var _AceRangeUtil = __webpack_require__(5);

	Object.defineProperty(exports, 'AceRangeUtil', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_AceRangeUtil).default;
	  }
	});

	var _AceRadarView = __webpack_require__(7);

	Object.defineProperty(exports, 'AceRadarView', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_AceRadarView).default;
	  }
	});

	var _AceViewportUtil = __webpack_require__(9);

	Object.defineProperty(exports, 'AceViewportUtil', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_AceViewportUtil).default;
	  }
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _AceSelectionMarker = __webpack_require__(2);

	var _AceSelectionMarker2 = _interopRequireDefault(_AceSelectionMarker);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Implements multiple colored selections in the ace editor.  Each selection is
	 * associated with a particular user. Each user is identified by a unique id
	 * and has a color associated with them.  The selection manager supports block
	 * selection through multiple AceRanges.
	 */
	var AceMultiSelectionManager = function () {

	  /**
	   * Constructs a new AceMultiSelectionManager that is bound to a particular
	   * Ace EditSession instance.
	   *
	   * @param session {EditSession}
	   *   The Ace EditSession to bind to.
	   */
	  function AceMultiSelectionManager(session) {
	    _classCallCheck(this, AceMultiSelectionManager);

	    this._selections = {};
	    this._session = session;
	  }

	  /**
	   * Adds a new collaborative selection.
	   *
	   * @param id {string}
	   *   The unique system identifier for the user associated with this selection.
	   * @param label {string}
	   *   A human readable / meaningful label / title that identifies the user.
	   * @param color {string}
	   *   A valid css color string.
	   * @param ranges {Array<AceRange>}
	   *   An array of ace ranges that specify the initial selection.
	   */


	  _createClass(AceMultiSelectionManager, [{
	    key: 'addSelection',
	    value: function addSelection(id, label, color, ranges) {
	      if (this._selections[id] !== undefined) {
	        throw new Error('Selection with id already defined: ' + id);
	      }

	      var marker = new _AceSelectionMarker2.default(this._session, id, label, color, ranges);

	      this._selections[id] = marker;
	      this._session.addDynamicMarker(marker, false);
	    }

	    /**
	     * Updates the selection for a particular user.
	     *
	     * @param id {string}
	     *   The unique identifier for the user.
	     * @param ranges {Array<AceRange>}
	     *   The array of ranges that specify the selection.
	     */

	  }, {
	    key: 'setSelection',
	    value: function setSelection(id, ranges) {
	      var selection = this._getSelection(id);

	      selection.setSelection(ranges);
	    }

	    /**
	     * Clears the selection (but does not remove it) for the specified user.
	     * @param id {string}
	     *   The unique identifier for the user.
	     */

	  }, {
	    key: 'clearSelection',
	    value: function clearSelection(id) {
	      var selection = this._getSelection(id);

	      selection.setSelection(null);
	    }

	    /**
	     * Removes the selection for the specified user.
	     * @param id {string}
	     *   The unique identifier for the user.
	     */

	  }, {
	    key: 'removeSelection',
	    value: function removeSelection(id) {
	      var selection = this._selections[id];

	      if (selection === undefined) {
	        throw new Error('Selection not found: ' + id);
	      }
	      this._session.removeMarker(selection.id);
	      delete this._selections[id];
	    }

	    /**
	     * Removes all selections.
	     */

	  }, {
	    key: 'removeAll',
	    value: function removeAll() {
	      var _this = this;

	      Object.getOwnPropertyNames(this._selections).forEach(function (key) {
	        _this.removeSelection(_this._selections[key].selectionId());
	      });
	    }
	  }, {
	    key: '_getSelection',
	    value: function _getSelection(id) {
	      var selection = this._selections[id];

	      if (selection === undefined) {
	        throw new Error('Selection not found: ' + id);
	      }
	      return selection;
	    }
	  }]);

	  return AceMultiSelectionManager;
	}();

	exports.default = AceMultiSelectionManager;

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var AceSelectionMarker = function () {
	  function AceSelectionMarker(session, selectionId, title, color, range) {
	    _classCallCheck(this, AceSelectionMarker);

	    this._session = session;
	    this._title = title;
	    this._color = color;
	    this._ranges = range || [];
	    this._selectionId = selectionId;
	    this._id = null;
	  }

	  _createClass(AceSelectionMarker, [{
	    key: 'update',
	    value: function update(html, markerLayer, session, layerConfig) {
	      var _this = this;

	      this._ranges.forEach(function (range) {
	        _this._renderRange(html, markerLayer, session, layerConfig, range);
	      });
	    }
	  }, {
	    key: '_renderRange',
	    value: function _renderRange(html, markerLayer, session, layerConfig, range) {
	      var screenRange = range.toScreenRange(session);

	      var height = layerConfig.lineHeight;
	      var top = markerLayer.$getTop(screenRange.start.row, layerConfig);
	      var left = markerLayer.$padding + screenRange.start.column * layerConfig.characterWidth;
	      var width = 0;

	      if (screenRange.isMultiLine()) {
	        // Render the start line
	        this._renderLine(html, { height: height, right: 0, top: top, left: left });

	        // from start of the last line to the selection end
	        top = markerLayer.$getTop(range.end.row, layerConfig);
	        width = screenRange.end.column * layerConfig.characterWidth;
	        this._renderLine(html, { height: height, width: width, top: top, left: markerLayer.$padding });

	        // all the complete lines
	        height = (range.end.row - range.start.row - 1) * layerConfig.lineHeight;
	        if (height < 0) {
	          return;
	        }
	        top = markerLayer.$getTop(range.start.row + 1, layerConfig);
	        this._renderLine(html, { height: height, right: 0, top: top, left: markerLayer.$padding });
	      } else {
	        width = (range.end.column - range.start.column) * layerConfig.characterWidth;
	        this._renderLine(html, { height: height, width: width, top: top, left: left });
	      }
	    }
	  }, {
	    key: '_renderLine',
	    value: function _renderLine(html, bounds) {
	      html.push('<div class="ace-multi-selection" style="');

	      if (typeof bounds.height === 'number') {
	        html.push(' height: ' + bounds.height + 'px;');
	      }

	      if (typeof bounds.width === 'number') {
	        html.push(' width: ' + bounds.width + 'px;');
	      }

	      if (typeof bounds.top === 'number') {
	        html.push(' top: ' + bounds.top + 'px;');
	      }

	      if (typeof bounds.left === 'number') {
	        html.push(' left: ' + bounds.left + 'px;');
	      }

	      if (typeof bounds.bottom === 'number') {
	        html.push(' bottom: ' + bounds.bottom + 'px;');
	      }

	      if (typeof bounds.right === 'number') {
	        html.push(' right: ' + bounds.right + 'px;');
	      }

	      html.push('background-color: ' + this._color + '">');
	      html.push('</div>');
	    }
	  }, {
	    key: 'setSelection',
	    value: function setSelection(ranges) {
	      if (ranges === undefined || ranges === null) {
	        this._ranges = [];
	      } else if (ranges instanceof Array) {
	        this._ranges = ranges;
	      } else {
	        this._ranges = [ranges];
	      }

	      this._forceSessionUpdate();
	    }
	  }, {
	    key: 'selectionId',
	    value: function selectionId() {
	      return this._selectionId;
	    }
	  }, {
	    key: 'markerId',
	    value: function markerId() {
	      return this._id;
	    }
	  }, {
	    key: '_forceSessionUpdate',
	    value: function _forceSessionUpdate() {
	      this._session._signal('changeBackMarker');
	    }
	  }]);

	  return AceSelectionMarker;
	}();

	exports.default = AceSelectionMarker;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _AceCursorMarker = __webpack_require__(4);

	var _AceCursorMarker2 = _interopRequireDefault(_AceCursorMarker);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Implements multiple colored cursors in the ace editor.  Each cursor is
	 * associated with a particular user. Each user is identified by a unique id
	 * and has a color associated with them.  Each cursor has a position in the
	 * editor which is specified by a 2-d row and column ({row: 0, column: 10}).
	 */
	var AceMultiCursorManager = function () {

	  /**
	   * Constructs a new AceMultiCursorManager that is bound to a particular
	   * Ace EditSession instance.
	   *
	   * @param session {EditSession}
	   *   The Ace EditSession to bind to.
	   */
	  function AceMultiCursorManager(session) {
	    _classCallCheck(this, AceMultiCursorManager);

	    this._cursors = {};
	    this._session = session;
	  }

	  /**
	   * Adds a new collaborative selection.
	   *
	   * @param id {string}
	   *   The unique system identifier for the user associated with this selection.
	   * @param label {string}
	   *   A human readable / meaningful label / title that identifies the user.
	   * @param color {string}
	   *   A valid css color string.
	   * @param position {*}
	   *   A 2D-position indicating the location of the cusror in row column format e.g. {row: 0, column: 10}
	   */


	  _createClass(AceMultiCursorManager, [{
	    key: 'addCursor',
	    value: function addCursor(id, label, color, position) {
	      if (this._cursors[id] !== undefined) {
	        throw new Error('Cursor with id already defined: ' + id);
	      }

	      var marker = new _AceCursorMarker2.default(this._session, id, label, color, position);

	      this._cursors[id] = marker;
	      this._session.addDynamicMarker(marker, true);
	    }

	    /**
	     * Updates the selection for a particular user.
	     *
	     * @param id {string}
	     *   The unique identifier for the user.
	     * @param position {*}
	     *   A 2-d position indicating the location of the cusror in row column format e.g. {row: 0, column: 10}
	     */

	  }, {
	    key: 'setCursor',
	    value: function setCursor(id, position) {
	      var cursor = this._getCursor(id);

	      cursor.setPosition(position);
	    }

	    /**
	     * Clears the cursor (but does not remove it) for the specified user.
	     *
	     * @param id {string}
	     *   The unique identifier for the user.
	     */

	  }, {
	    key: 'clearCursor',
	    value: function clearCursor(id) {
	      var cursor = this._getCursor(id);

	      cursor.setPosition(null);
	    }

	    /**
	     * Removes the cursor for the specified user.
	     *
	     * @param id {string}
	     *   The unique identifier for the user.
	     */

	  }, {
	    key: 'removeCursor',
	    value: function removeCursor(id) {
	      var cursor = this._cursors[id];

	      if (cursor === undefined) {
	        throw new Error('Cursor not found: ' + id);
	      }
	      this._session.removeMarker(cursor.id);
	      delete this._cursors[id];
	    }

	    /**
	     * Removes all cursors.
	     */

	  }, {
	    key: 'removeAll',
	    value: function removeAll() {
	      var _this = this;

	      Object.getOwnPropertyNames(this._cursors).forEach(function (key) {
	        _this.removeCursor(_this._cursors[key].cursorId());
	      });
	    }
	  }, {
	    key: '_getCursor',
	    value: function _getCursor(id) {
	      var cursor = this._cursors[id];

	      if (cursor === undefined) {
	        throw new Error('Cursor not found: ' + id);
	      }
	      return cursor;
	    }
	  }]);

	  return AceMultiCursorManager;
	}();

	exports.default = AceMultiCursorManager;

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var AceCursorMarker = function () {
	  function AceCursorMarker(session, cursorId, title, color, position) {
	    _classCallCheck(this, AceCursorMarker);

	    this._session = session;
	    this._title = title;
	    this._color = color;
	    this._position = position ? this._convertPosition(position) : null;
	    this._cursorId = cursorId;
	    this._id = null;
	  }

	  _createClass(AceCursorMarker, [{
	    key: 'update',
	    value: function update(html, markerLayer, session, layerConfig) {
	      if (this._position === null) {
	        return;
	      }

	      var screenPosition = this._session.documentToScreenPosition(this._position.row, this._position.column);

	      var top = markerLayer.$getTop(screenPosition.row, layerConfig);
	      var left = markerLayer.$padding + screenPosition.column * layerConfig.characterWidth;
	      var height = layerConfig.lineHeight;

	      html.push('<div class="ace-multi-cursor ace_start" style="', 'height: ' + (height - 3) + 'px;', 'width: ' + 2 + 'px;', 'top: ' + (top + 2) + 'px;', 'left: ' + left + 'px;', 'background-color: ' + this._color + ';', '"></div>');

	      // Caret Top
	      html.push('<div class="ace-multi-cursor ace_start" style="', 'height: ' + 5 + 'px;', 'width: ' + 6 + 'px;', 'top: ' + (top - 2) + 'px;', 'left: ' + (left - 2) + 'px;', 'background-color: ' + this._color + ';', '"></div>');
	    }
	  }, {
	    key: 'setPosition',
	    value: function setPosition(position) {
	      this._position = this._convertPosition(position);
	      this._forceSessionUpdate();
	    }
	  }, {
	    key: 'setVisible',
	    value: function setVisible(visible) {
	      var old = this._visible;

	      this._visible = visible;
	      if (old !== this._visible) {
	        this._forceSessionUpdate();
	      }
	    }
	  }, {
	    key: 'isVisible',
	    value: function isVisible() {
	      return this._visible;
	    }
	  }, {
	    key: 'cursorId',
	    value: function cursorId() {
	      return this._cursorId;
	    }
	  }, {
	    key: 'markerId',
	    value: function markerId() {
	      return this._id;
	    }
	  }, {
	    key: '_forceSessionUpdate',
	    value: function _forceSessionUpdate() {
	      this._session._signal('changeFrontMarker');
	    }
	  }, {
	    key: '_convertPosition',
	    value: function _convertPosition(position) {
	      var type = typeof position === 'undefined' ? 'undefined' : _typeof(position);

	      if (position === null) {
	        return null;
	      } else if (type === 'number') {
	        return this._session.getDocument().indexToPosition(position, 0);
	      } else if (typeof position.row === 'number' && typeof position.column === 'number') {
	        return position;
	      }

	      throw new Error('Invalid position: ' + position);
	    }
	  }]);

	  return AceCursorMarker;
	}();

	exports.default = AceCursorMarker;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _ace = __webpack_require__(6);

	var _ace2 = _interopRequireDefault(_ace);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var AceRange = null;

	if (_ace2.default.acequire !== undefined) {
	  AceRange = _ace2.default.acequire('ace/range').Range;
	} else {
	  AceRange = _ace2.default.require('ace/range').Range;
	}

	var AceRangeUtil = function () {
	  function AceRangeUtil() {
	    _classCallCheck(this, AceRangeUtil);
	  }

	  _createClass(AceRangeUtil, null, [{
	    key: 'rangeToJson',
	    value: function rangeToJson(range) {
	      return {
	        'start': {
	          'row': range.start.row,
	          'column': range.start.column
	        },
	        'end': {
	          'row': range.end.row,
	          'column': range.end.column
	        }
	      };
	    }
	  }, {
	    key: 'jsonToRange',
	    value: function jsonToRange(range) {
	      return new AceRange(range.start.row, range.start.column, range.end.row, range.end.column);
	    }
	  }, {
	    key: 'rangesToJson',
	    value: function rangesToJson(ranges) {
	      return ranges.map(function (range) {
	        return AceRangeUtil.rangeToJson(range);
	      });
	    }
	  }, {
	    key: 'jsonToRanges',
	    value: function jsonToRanges(ranges) {
	      return ranges.map(function (range) {
	        return AceRangeUtil.jsonToRange(range);
	      });
	    }
	  }, {
	    key: 'toJson',
	    value: function toJson(value) {
	      if (value instanceof Array) {
	        return AceRangeUtil.rangesToJson(value);
	      }

	      return AceRangeUtil.rangeToJson(value);
	    }
	  }, {
	    key: 'fromJson',
	    value: function fromJson(value) {
	      if (value instanceof Array) {
	        return AceRangeUtil.jsonToRanges(value);
	      }

	      return AceRangeUtil.jsonToRange(value);
	    }
	  }]);

	  return AceRangeUtil;
	}();

	exports.default = AceRangeUtil;

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("ace");

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _AceRadarViewIndicator = __webpack_require__(8);

	var _AceRadarViewIndicator2 = _interopRequireDefault(_AceRadarViewIndicator);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var AceRadarView = function () {
	  function AceRadarView(element, editor) {
	    _classCallCheck(this, AceRadarView);

	    this._container = null;
	    if (typeof element === 'string') {
	      this._container = document.getElementById(element);
	    } else {
	      this._container = element;
	    }

	    this._container.style.position = 'relative';
	    this._views = [];
	    this._editor = editor;
	  }

	  _createClass(AceRadarView, [{
	    key: 'addView',
	    value: function addView(id, label, color, viewRows, cursorRow) {
	      var indicator = new _AceRadarViewIndicator2.default(id, label, color, viewRows, cursorRow, this._editor);

	      this._container.appendChild(indicator.element());
	      indicator.update();

	      this._views[id] = indicator;
	    }
	  }, {
	    key: 'hasView',
	    value: function hasView(id) {
	      return this._views[id] !== undefined;
	    }

	    /**
	     *
	     * @param id
	     * @param rows {start: 0, end: 34}
	     */

	  }, {
	    key: 'setViewRows',
	    value: function setViewRows(id, rows) {
	      var indicator = this._views[id];

	      indicator.setViewRows(rows);
	    }
	  }, {
	    key: 'setCursorRow',
	    value: function setCursorRow(id, row) {
	      var indicator = this._views[id];

	      indicator.setCursorRow(row);
	    }
	  }, {
	    key: 'clearView',
	    value: function clearView(id) {
	      // fixme implement
	    }
	  }, {
	    key: 'removeView',
	    value: function removeView(id) {
	      var indicator = this._views[id];

	      indicator.dispose();
	      delete this._views[id];
	    }
	  }]);

	  return AceRadarView;
	}();

	exports.default = AceRadarView;

/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var AceRadarViewIndicator = function () {
	  function AceRadarViewIndicator(id, label, color, viewRows, cursorRow, editor) {
	    var _this = this;

	    _classCallCheck(this, AceRadarViewIndicator);

	    this._id = id;
	    this._label = label;
	    this._color = color;
	    this._viewRows = viewRows;
	    this._cursorRow = cursorRow;
	    this._editor = editor;
	    this._docLineCount = editor.getSession().getLength();

	    this._editorListener = function () {
	      var newLineCount = _this._editor.getSession().getLength();

	      if (newLineCount !== _this._docLineCount) {
	        _this._docLineCount = newLineCount;
	        _this.update();
	      }
	    };
	    this._editor.on('change', this._editorListener);

	    this._scrollElement = document.createElement('div');
	    this._scrollElement.className = 'ace-radar-view-scroll-indicator';

	    this._scrollElement.style.borderColor = this._color;
	    this._scrollElement.style.background = this._color;

	    // todo implement a custom tooltip for consistent presentation.
	    this._scrollElement.title = this._label;

	    this._scrollElement.addEventListener('click', function (e) {
	      var middle = (_this._viewRows.end - _this._viewRows.start) / 2 + _this._viewRows.start;

	      _this._editor.scrollToLine(middle, true, false);
	    }, false);

	    this._cursorElement = document.createElement('div');
	    this._cursorElement.className = 'ace-radar-view-cursor-indicator';
	    this._cursorElement.style.background = this._color;
	    this._cursorElement.title = this._label;

	    this._cursorElement.addEventListener('click', function (e) {
	      _this._editor.scrollToLine(_this._cursorRow, true, false);
	    }, false);

	    this._wrapper = document.createElement('div');
	    this._wrapper.className = 'ace-radar-view-wrapper';
	    this._wrapper.style.display = 'none';

	    this._wrapper.appendChild(this._scrollElement);
	    this._wrapper.appendChild(this._cursorElement);
	  }

	  _createClass(AceRadarViewIndicator, [{
	    key: 'element',
	    value: function element() {
	      return this._wrapper;
	    }
	  }, {
	    key: 'setCursorRow',
	    value: function setCursorRow(cursorRow) {
	      this._cursorRow = cursorRow;
	      this.update();
	    }
	  }, {
	    key: 'setViewRows',
	    value: function setViewRows(viewRows) {
	      this._viewRows = viewRows;
	      this.update();
	    }
	  }, {
	    key: 'update',
	    value: function update() {
	      if (!this._isSet(this._viewRows) && !this._isSet(this._cursorRow)) {
	        this._wrapper.style.display = 'none';
	      } else {
	        this._wrapper.style.display = null;
	        var maxLine = this._docLineCount - 1;

	        if (!this._isSet(this._viewRows)) {
	          this._scrollElement.style.display = 'none';
	        } else {
	          var topPercent = Math.min(maxLine, this._viewRows.start) / maxLine * 100;
	          var bottomPercent = 100 - Math.min(maxLine, this._viewRows.end) / maxLine * 100;

	          this._scrollElement.style.top = topPercent + '%';
	          this._scrollElement.style.bottom = bottomPercent + '%';
	          this._scrollElement.style.display = null;
	        }

	        if (!this._isSet(this._cursorRow)) {
	          this._cursorElement.style.display = 'none';
	        } else {
	          var cursorPercent = Math.min(this._cursorRow, maxLine) / maxLine;
	          var ratio = (this._wrapper.offsetHeight - this._cursorElement.offsetHeight) / this._wrapper.offsetHeight;
	          var cursorTop = cursorPercent * ratio * 100;

	          this._cursorElement.style.top = cursorTop + '%';
	          this._cursorElement.style.display = null;
	        }
	      }
	    }
	  }, {
	    key: '_isSet',
	    value: function _isSet(value) {
	      return value !== undefined && value !== null;
	    }
	  }, {
	    key: 'dispose',
	    value: function dispose() {
	      this._wrapper.parentNode.removeChild(this._wrapper);
	      this._editor.off(this._editorListener);
	    }
	  }]);

	  return AceRadarViewIndicator;
	}();

	exports.default = AceRadarViewIndicator;

/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var AceViewportUtil = function () {
	  function AceViewportUtil() {
	    _classCallCheck(this, AceViewportUtil);
	  }

	  _createClass(AceViewportUtil, null, [{
	    key: "getVisibleIndexRange",
	    value: function getVisibleIndexRange(editor) {
	      var firstRow = editor.getFirstVisibleRow();
	      var lastRow = editor.getLastVisibleRow();

	      if (!editor.isRowFullyVisible(firstRow)) {
	        firstRow++;
	      }

	      if (!editor.isRowFullyVisible(lastRow)) {
	        lastRow--;
	      }

	      var startPos = editor.getSession().getDocument().positionToIndex({ row: firstRow, column: 0 });

	      // todo, this should probably be the end of the row
	      var endPos = editor.getSession().getDocument().positionToIndex({ row: lastRow, column: 0 });

	      return {
	        start: startPos,
	        end: endPos
	      };
	    }
	  }, {
	    key: "indicesToRows",
	    value: function indicesToRows(editor, startIndex, endIndex) {
	      var startRow = editor.getSession().getDocument().indexToPosition(startIndex).row;
	      var endRow = editor.getSession().getDocument().indexToPosition(endIndex).row;

	      return {
	        start: startRow,
	        end: endRow
	      };
	    }
	  }]);

	  return AceViewportUtil;
	}();

	exports.default = AceViewportUtil;

/***/ }
/******/ ]);