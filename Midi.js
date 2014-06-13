(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Midi = factory(root.b);
    }
})(this, function () {
    var Midi = function () {
        this._actions = {};
        if (!navigator.requestMIDIAccess) {
            this._accessPromise = Promise.reject('Web MIDI not available!');
        } else {
            this._accessPromise = navigator.requestMIDIAccess().then(
                function (midiAccess, midiOptions) {
                    this._midiAccess = midiAccess;
                }.bind(this),
                function (error) {
                    console.error('Web MIDI initialization failed!', error);
                }
            );
        }
    };

    Midi.prototype = {
        _selectedIndex: null,
        _midiAccess: null,
        _actions: null,
        _accessPromise: null,

        selectInput: function (index) {
            if (this._selectedIndex) {
                this._midiAccess.inputs()[this._selectedIndex].onmidimessage = undefined;
                this._selectedIndex = null;
            }
            // There seems to be a bug in the Web Midi implementation, that will cause the onmidimessage handler
            // to vanish, if theres no reference to the used input...
            window.inputs = this._midiAccess.inputs();
            var input = this._midiAccess.inputs()[index];
            if (!input) {
                console.warn('Midi input #' + index + ' not found!');
                return;
            }
            input.onmidimessage = this.onMessage.bind(this);
            this._selectedIndex = index;
        },

        onMessage: function (event) {
            var data = event.data,
                actionDescriptor = pad(data[0].toString(16), 0, 2) +
                    pad(data[1].toString(16), 0, 2) +
                    pad(data[2].toString(16), 0, 2),
                action = this._actions[actionDescriptor];
            if (action) {
                action(event);
            }
            console.log('Calling action handler for "' + actionDescriptor + '"');
        },

        registerAction: function (filter, action) {
            this._actions[filter] = action;
        },

        midiAccessPromise: function () {
            return this._accessPromise;
        }
    };

    function pad(input, padSymbol, length) {
        var output = input;
        while (output.length < length) {
            output = padSymbol + output;
        }
        return output;
    }

    return Midi;
});
