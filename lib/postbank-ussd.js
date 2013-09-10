var vumigo = require("vumigo_v01");
var jed = require("jed");

if (typeof api === "undefined") {
    // testing hook (supplies api when it is not passed in by the real sandbox)
    var api = this.api = new vumigo.dummy_api.DummyApi();
}

var Promise = vumigo.promise.Promise;
var success = vumigo.promise.success;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;
var InteractionMachine = vumigo.state_machine.InteractionMachine;
var StateCreator = vumigo.state_machine.StateCreator;

function VumiGoSkeleton() {
    var self = this;
    // The first state to enter
    StateCreator.call(self, 'first_state');

    self.send_sms = function(im, content, to_addr) {
        var sms_tag = im.config.sms_tag;
        if (!sms_tag) return success(true);
        var p = new Promise();
        im.api.request("outbound.send_to_tag", {
            to_addr: to_addr,
            content: content,
            tagpool: sms_tag[0],
            tag: sms_tag[1]
        }, function(reply) {
            p.callback(reply.success);
        });
        return p;
    };

    self.add_state(new FreeText(
        "first_state",
        "second_state",
        "Where are you now?"
    ));

    self.add_creator('second_state', function(state_name, im) {
        var given_location = im.get_user_answer('first_state');

        var APP_ID = "YQcdfF8x99lP2d2tMGn4RBktmDFOv3QhOF5n4vmv";
        var MASTER_KEY = "NF9K4tugR4oQAWRUfnEK3HRG0Lbgmsfjur4iSkLL";
        var app = new Parse(APP_ID, MASTER_KEY);

        app.findMany("Postbank", {loc2: given_location.toUpperCase()}, function(err, response) {
            //console.log(response);
            addr = response[0]
            addr.Address

        });
    });

    self.add_state(new EndState(
        "end",
        "Address sent via SMS!",
        "start_address",
        {
            on_enter: function() {
                var maps_api = self.maps_api(im);
                var start_address = im.get_user_answer('confirm_start_address').split('@');
                var start_lat = start_address[0];
                var start_lng = start_address[1];
                var start_name = start_address[2];

                var dest_address = im.get_user_answer('confirm_destination_address').split('@');
                var dest_lat = dest_address[0];
                var dest_lng = dest_address[1];
                var dest_name = dest_address[2];

                var origin = start_lat + ',' + start_lng;
                var destination = dest_lat + ',' + dest_lng;

                var to_addr = (im.get_user_answer("send_directions") == 'myself' ?
                                im.user_addr : im.get_user_answer('custom_to_addr'));

                var directions = maps_api.get_directions(origin, destination);
                directions.add_callback(function(directions) {
                    instructions = directions.steps.map(function(step, index) {
                        var html_instructions = step.html_instructions;
                        var stripped_instructions = html_instructions.replace(/<(?:.|\n)*?>/gm, '');
                        return index + 1 + '. ' + stripped_instructions;
                    }).join('\n');
                    return instructions;
                });
                directions.add_callback(function(instructions) {
                    return self.send_sms(im, instructions, to_addr);
                });
                directions.add_callback(function(result) {
                    im.log('SMS instructions sent');
                });
                return directions;
            }
        }));
}

// launch app
var states = new VumiGoSkeleton();
var im = new InteractionMachine(api, states);
im.attach();