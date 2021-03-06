'use strict';

var Format = require('geomag/Formatter'),
    ObservatoryFactory = require('geomag/ObservatoryFactory'),
    Util = require('util/Util'),
    View = require('mvc/View');


var _DEFAULTS = {
  factory: null
};

var _ID_SET = 0;


  /**
   * Construct a new DeclinationSummaryView.
   *
   * @param options {Object}
   *        view options.
   * @param options.calculator {geomag.ObservationBaselineCalculator}
   *        the calculator to use.
   * @param options.factory {geomag.ObservatoryFactory}
   *        the factory to use.
   * @parem options.reading {geomag.Reading}
   *        the reading to display.
   */
var DeclinationSummaryView = function (options) {
  var _this,
      _initialize,

      _absolute,
      _baselineMin,
      _calculator,
      _eBaseline,
      _endTime,
      _factory,
      _measurements,
      _name,
      _ordMin,
      _reading,
      _shift,
      _startTime,
      _valid,

      _onChange;


  _this = View(options);
  /**
   * Initialize view, and call render.
   * @param options {Object} same as constructor.
   */
  _initialize = function (options) {
    var el = _this.el,
        i = null,
        len = null,
        set = ++_ID_SET;

    options = Util.extend({}, _DEFAULTS, options);
    _calculator = options.calculator;
    _factory = options.factory || ObservatoryFactory();
    _reading = options.reading;

    el.innerHTML = [
      '<th class="name" scope="row"></th>',
      '<td class="valid">',
        '<input type="checkbox" id="valid-declination-', set, '" />',
        '<label for="valid-declination-', set, '"></label>',
      '</td>',
      '<td class="start-time"></td>',
      '<td class="end-time"></td>',
      '<td class="absolute-declination"></td>',
      '<td class="ord-min"></td>',
      '<td class="baseline-min"></td>',
      '<td class="baseline-nt"></td>',
      '<td class="shift">',
        '<select>',
          '<option value="-180">-180</option>',
          '<option value="0" selected="selected">0</option>',
          '<option value="180">+180</option>',
        '</select>',
      '</td>'
    ].join('');

    // save references to elements that will be updated during render
    _name = el.querySelector('.name');
    _valid = el.querySelector('.valid > input');
    _startTime = el.querySelector('.start-time');
    _endTime = el.querySelector('.end-time');
    _absolute = el.querySelector('.absolute-declination');
    _ordMin = el.querySelector('.ord-min');
    _baselineMin = el.querySelector('.baseline-min');
    _eBaseline = el.querySelector('.baseline-nt');
    _shift = el.querySelector('.shift > select');

    _measurements = _factory.getDeclinationMeasurements(_reading);

    _valid.addEventListener('change', _onChange);
    _shift.addEventListener('change', _onChange);

    _reading.on('change:declination_valid', 'render', _this);
    _reading.on('change:declination_shift', 'render', _this);

    // watches for changes in pier/mark
    _calculator.on('change', 'render', _this);

    for (i = 0, len = _measurements.length; i < len; i++) {
      _measurements[i].on('change', 'render', _this);
    }

    _this.render();
  };

  _onChange = function () {
    _reading.set({
      declination_valid: (_valid.checked ? 'Y' : 'N'),
      declination_shift: parseInt(_shift.value, 10)
    });
  };


  _this.destroy = Util.compose(
      // sub class destroy method
      function () {
        // Remove event listeners
        _valid.removeEventListener('change', _onChange);
        _shift.removeEventListener('change', _onChange);

        // Clean up private method
        _onChange = null;

        // Clean up private variables
        _absolute = null;
        _baselineMin = null;
        _calculator = null;
        _eBaseline = null;
        _endTime = null;
        _factory = null;
        _measurements = null;
        _name = null;
        _ordMin = null;
        _reading = null;
        _shift = null;
        _startTime = null;
        _valid = null;

        _this = null;
      },
      // parent class destroy method
      _this.destroy);

  _this.render = function () {
    var declinations,
        endTime,
        measurements,
        startTime,
        times;

    startTime = null;
    endTime = null;
    measurements = _reading.get('measurements').data();
    declinations = _factory.getDeclinations(measurements);

    _name.innerHTML = _reading.get('set_number');

    _valid.checked = (_reading.get('declination_valid') === 'Y');

    times = _factory.getMeasurementValues(declinations, 'time');
    if (times.length > 0) {
      startTime = Math.min.apply(null, times);
      endTime = Math.max.apply(null, times);
    }
    _startTime.innerHTML = Format.time(startTime);
    _endTime.innerHTML = Format.time(endTime);

    _shift.value = _reading.get('declination_shift');

    _absolute.innerHTML =
        Format.degreesMinutes(_calculator.magneticDeclination(_reading));

    _ordMin.innerHTML = Format.minutes(_calculator.dComputed(_reading)*60);
    _baselineMin.innerHTML = Format.minutes(_calculator.dBaseline(_reading)*60);
    _eBaseline.innerHTML = Format.nanoteslas(_calculator.eBaseline(_reading));
  };


  _initialize(options);
  options = null;
  return _this;
};

module.exports = DeclinationSummaryView;
