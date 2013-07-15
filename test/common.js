/*
 * Copyright (c) 2013, Joyent, Inc. All rights reserved.
 *
 * test/common.js: common routines for all tests
 */

var assert = require('assert-plus');
var async = require('async');
var node_uuid = require('node-uuid');


var IMAGE_UUID = '1eddb7ec-3e1d-423a-b876-f6e069496f35';

function createApplication(uuid, cb) {
	var name = 'empty_test_application';

	var opts = {};
	opts.uuid = uuid;
	opts.params = {};
	if (process.env['IMAGE_UUID'])
		opts.params.image_uuid = process.env['IMAGE_UUID'];

	this.sapi.createApplication(name, process.env.ADMIN_UUID, opts,
	    function (err, app) {
		return (cb(err));
	});
}

function createService(app_uuid, uuid, cb) {
	var name = 'empty_test_service';

	var opts = {};
	opts.params = {};
	opts.params.ram = 256;
	opts.params.networks = [ 'admin' ];
	opts.params.image_uuid = IMAGE_UUID;

	if (arguments.length === 2)
		cb = uuid;
	else
		opts.uuid = uuid;

	this.sapi.createService(name, app_uuid, opts, function (err, svc) {
		return (cb(err));
	});
}

function createInstance(svc_uuid, uuid, cb) {
	var opts = {};

	if (arguments.length === 2)
		cb = uuid;
	else
		opts.uuid = uuid;

	if (!opts.params)
		opts.params = {};
	if (!opts.params.alias)
		opts.params.alias = 'sapitest-' + node_uuid.v4().substr(0, 8);

	this.sapi.createInstance(svc_uuid, opts, cb);
}

function createManifest(uuid, cb) {
	var opts = {};

	if (arguments.length === 1)
		cb = uuid;
	else
		opts.uuid = uuid;

	opts.path = '/var/tmp/config.json';
	opts.template = '{ logLevel: "debug" }';
	opts.name = 'more_or_less_empty test config';

	this.sapi.createManifest(opts, cb);
}

function testUpdates(t, uri, cb) {
	var self = this;

	async.waterfall([
		function (subcb) {
			var changes = {};
			changes.action = 'update';
			changes.params = {};
			changes.params.foo = 'baz';
			changes.metadata = {};
			changes.metadata.foo = 'bar';

			self.client.put(uri, changes,
			    function (err, _, res, obj) {
				t.ifError(err);
				t.equal(res.statusCode, 200);

				t.equal(obj.params.foo, 'baz');
				t.equal(obj.metadata.foo, 'bar');

				subcb(null);
			});
		},
		function (subcb) {
			var changes = {};
			changes.action = 'delete';
			changes.params = {};
			changes.params.foo = ' ';
			changes.metadata = {};
			changes.metadata.foo = ' ';

			self.client.put(uri, changes,
			    function (err, _, res, obj) {
				t.ifError(err);
				t.equal(res.statusCode, 200);

				t.ok(!obj.params.foo);
				t.ok(!obj.metadata.foo);

				subcb(null);
			});
		},
		function (subcb) {
			var changes = {};
			changes.action = 'update';
			changes.params = {};
			changes.params.oldparam = 'oldvalue';
			changes.metadata = {};
			changes.metadata.oldmd = 'oldvalue';

			self.client.put(uri, changes,
			    function (err, _, res, obj) {
				t.ifError(err);
				t.equal(res.statusCode, 200);

				t.equal(obj.params.oldparam, 'oldvalue');
				t.equal(obj.metadata.oldmd, 'oldvalue');

				subcb(null);
			});
		},
		function (subcb) {
			var changes = {};
			changes.action = 'replace';
			changes.params = {};
			changes.params.newparam = 'newvalue';
			changes.metadata = {};
			changes.metadata.newmd = 'newvalue';

			self.client.put(uri, changes,
			    function (err, _, res, obj) {
				t.ifError(err);
				t.equal(res.statusCode, 200);

				t.equal(obj.params.newparam, 'newvalue');
				t.equal(obj.metadata.newmd, 'newvalue');
				t.equal(Object.keys(obj.params).length, 1);
				t.equal(Object.keys(obj.metadata).length, 1);

				subcb(null);
			});
		}
	], cb);
}


exports.IMAGE_UUID = IMAGE_UUID;

exports.createApplication = createApplication;
exports.createService = createService;
exports.createInstance = createInstance;
exports.createManifest = createManifest;

exports.testUpdates = testUpdates;
