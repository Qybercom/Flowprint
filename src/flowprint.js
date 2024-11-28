/**
 * @param {string} selector
 * @param {object=} opt
 *
 * @constructor
 */
var Flowprint = function (selector, opt) {
	opt = Flowprint._extend(opt, {
		data: {
			blocks: [],
			links: []
		},

		init: true,

		grid: {
			step: 0,
			visual: {
				step: null,
				width: null,
				color: null,
				small: {
					step: null,
					width: null,
					color: null,
					h: {
						step: null,
						width: null,
						color: null
					},
					v: {
						step: null,
						width: null,
						color: null
					}
				},
				big: {
					step: null,
					width: null,
					color: null,
					h: {
						step: null,
						width: null,
						color: null
					},
					v: {
						step: null,
						width: null,
						color: null
					}
				}
			}
		},

		options: {
			restrictEdges: true,
			pinKindAuto: true,
			linkDenySameBlock: true,
			linkDenySamePin: true,
			linkDenyOtherKind: true
		},

		events: {
			onInit: null,
			onBlockAdd: null,
			onBlockRemove: null,
			onLinkAdd: null,
			onLinkRemove: null,
			onLinkStart: null,
			onLinkFinish: null,
			onClick: null,
			onPointerDown: null,
			onPointerUp: null,
			onPointerOver: null,
			onPointerOut: null,
			onPointerMove: null
		},
		eventsBlock: {
			onInit: null,
			onMove: null,
			onClick: null,
			onPointerDown: null,
			onPointerUp: null,
			onPointerOver: null,
			onPointerOut: null
		},
		eventsLink: {
			onInit: null,
			onMove: null,
			onMoveEnd1: null,
			onMoveEnd2: null,
			onClick: null,
			onPointerDown: null,
			onPointerUp: null,
			onPointerOver: null,
			onPointerOut: null
		},
		eventsPin: {
			onInit: null,
			onFill: null,
			onEmpty: null,
			onClick: null,
			onPointerDown: null,
			onPointerUp: null,
			onPointerOver: null,
			onPointerOut: null
		}
	});

	var that = this,
		init = false,
		stateLinkNew = null,
		stateBlockMove = null,
		virtualX = 0,
		virtualY = 0,
		onClick = function (e) {
			var node = Flowprint.Pin._node(e.target),
				link = null,
				pin = null;

			if (node !== null) {
				pin = that.Pin(node.element.id);

				if (stateLinkNew === null) {
					var add = null;

					if (that.onLinkStart instanceof Function)
						add = that.onLinkStart(that, link, pin, e);

					if (add !== false) {
						if (add === null || add === undefined)
							add = {
								x: node.x,
								y: node.y,
								p1: pin.id,
								kind: pin.kind
							};

						that.LinkAdd(add, function (id) {
							stateLinkNew = id;
						});
					}
				}
				else {
					link = that.Link(stateLinkNew);

					var finish = true;

					if (that.onLinkFinish instanceof Function)
						finish = that.onLinkFinish(that, link, pin, e);

					if (finish !== false) {
						link.MoveEnd2(node.x, node.y, pin.id);
						pin.Fill(link.id);
					}

					stateLinkNew = null;
				}
			}
			else {
				if (stateLinkNew === null) { }
				else {
					link = that.Link(stateLinkNew);

					var remove = true;

					if (that.onLinkFinish instanceof Function)
						remove = that.onLinkFinish(that, link, null, e);

					if (remove !== false) {
						that.LinkRemove(link.id);

						stateLinkNew = null;
					}
				}
			}

			if (that.onClick instanceof Function)
				that.onClick(that, e);
		},
		onPointerDown = function (e) {
			if (stateLinkNew === null) {
				var block = Flowprint.Block._node(e.target);

				if (block !== null) {
					block.setPointerCapture(e.pointerId);

					stateBlockMove = block.id;
				}
			}

			if (that.onPointerDown instanceof Function)
				that.onPointerDown(that, e);
		},
		onPointerUp = function (e) {
			if (stateBlockMove) {
				stateBlockMove = null;
			}

			if (that.onPointerUp instanceof Function)
				that.onPointerUp(that, e);
		},
		onPointerMove = function (e) {
			if (stateBlockMove === null) {
				if (e.target.classList.contains('flowprint-layer')) {
					if (stateLinkNew !== null) {
						that.Link(stateLinkNew)
							.MoveEnd2(e.offsetX, e.offsetY);
					}
				}
			}
			else {
				var block = that.Block(stateBlockMove),
					moveX = block.x + e.movementX,
					moveY = block.y + e.movementY;

				if (opt.grid.step !== 0) {
					var movementX = 0,
						movementY = 0;

					virtualX += e.movementX;
					virtualY += e.movementY;

					if (virtualX < -opt.grid.step) {
						movementX = -opt.grid.step;
						virtualX += opt.grid.step;
					}
					if (virtualX > opt.grid.step) {
						movementX = opt.grid.step;
						virtualX -= opt.grid.step;
					}

					if (virtualY < -opt.grid.step) {
						movementY = -opt.grid.step;
						virtualY += opt.grid.step;
					}
					if (virtualY > opt.grid.step) {
						movementY = opt.grid.step;
						virtualY -= opt.grid.step;
					}

					moveX = block.x + movementX;
					moveY = block.y + movementY;
				}

				var move = !opt.options.restrictEdges || (
					(moveX >= 0 && (moveX + block.Width()) <= that.Elem.offsetWidth) &&
					(moveY >= 0 && (moveY + block.Height()) <= that.Elem.offsetHeight)
				);

				if (move)
					block.Move(moveX, moveY);
			}

			if (that.onPointerMove instanceof Function)
				that.onPointerMove(that, e);
		},
		events = {
			click: onClick,
			pointerover: function (e) { if (that.onPointerOver instanceof Function) that.onPointerOver(that, e); },
			pointerout: function (e) { if (that.onPointerOut instanceof Function) that.onPointerOut(that, e); },
			pointerdown: onPointerDown,
			pointermove: onPointerMove,
			pointerup: onPointerUp
		};

	that.Elem = document.querySelector(selector);
	that.data = {
		blocks: [],
		links: []
	};

	that.onInit = opt.events.onInit;
	that.onBlockAdd = opt.events.onBlockAdd;
	that.onBlockRemove = opt.events.onBlockRemove;
	that.onLinkAdd = opt.events.onLinkAdd;
	that.onLinkRemove = opt.events.onLinkRemove;
	that.onLinkStart = opt.events.onLinkStart;
	that.onLinkFinish = opt.events.onLinkFinish;
	that.onClick = opt.events.onClick;
	that.onPointerDown = opt.events.onPointerDown;
	that.onPointerUp = opt.events.onPointerUp;
	that.onPointerOver = opt.events.onPointerOver;
	that.onPointerOut = opt.events.onPointerOut;
	that.onPointerMove = opt.events.onPointerMove;

	/**
	 * @returns {Flowprint}
	 */
	that.Init = function () {
		init = true;

		var element = document.createElement('div'),
			i = 0,
			key = null,
			method = null,
			event = null,
			keys = {
				blocks: 'Block',
				links: 'Link'
			},
			cssGrid = Flowprint._cssGrid(opt.grid.visual);

		element.setAttribute('class', 'flowprint');

		element.style['background'] = cssGrid['background'];
		element.style['background-size'] = cssGrid['background-size'];

		element.innerHTML =''
			+ '<div class="flowprint-layer objects"></div>'
			+ '<svg class="flowprint-layer canvas"></svg>';

		for (event in events)
			element.addEventListener(event, events[event]);

		that.Elem.appendChild(element);

		for (key in keys) {
			i = 0;
			method = keys[key] + 'Add';

			while (i < opt.data[key].length) {
				that[method](opt.data[key][i]);

				i++;
			}
		}

		Flowprint._ids++;

		if (that.onInit instanceof Function)
			that.onInit(that);

		return that;
	};

	/**
	 * @param {string} id
	 *
	 * @returns {Flowprint.Block|null}
	 */
	that.Block = function (id) {
		var i = 0;

		while (i < that.data.blocks.length) {
			if (that.data.blocks[i].id === id)
				return that.data.blocks[i];

			i++;
		}

		return null;
	};

	/**
	 * @param {Flowprint.Block|object} data
	 *
	 * @return {Flowprint}
	 */
	that.BlockAdd = function (data) {
		if (!init) opt.data.links.push(data);
		else {
			if (!(data instanceof Flowprint.Block))
				data = new Flowprint.Block(Flowprint._extend(data, {
					eventsPin: opt.eventsPin,
					_init: false
				}));

			var onMove = opt.eventsBlock.onMove;
			opt.eventsBlock.onMove = function (block, x, y) {
				var move = true;

				if (onMove instanceof Function)
					move = onMove(block, x, y);

				if (move !== false) {
					var pins = block.Pins(),
						position = null,
						i = 0,
						j = 0;

					while (i < pins.length) {
						position = pins[i].Position();

						if (position !== null) {
							j = 0;

							while (j < that.data.links.length) {
								if (that.data.links[j].p1 === position.element.id)
									that.data.links[j].MoveEnd1(position.x, position.y);

								if (that.data.links[j].p2 === position.element.id)
									that.data.links[j].MoveEnd2(position.x, position.y);

								j++;
							}
						}

						i++;
					}
				}
			};

			var block = data.Events(opt.eventsBlock).Init(),
				add = true;

			if (that.onBlockAdd instanceof Function)
				add = that.onBlockAdd(that, block);

			if (add !== false) {
				that.Elem
					.querySelector('.flowprint')
					.querySelector('.flowprint-layer.objects')
					.appendChild(block.Container());

				that.data.blocks.push(block);
			}
		}

		return that;
	};

	/**
	 * @param {string} id
	 *
	 * @returns {Flowprint}
	 */
	that.BlockRemove = function (id) {
		var i = 0,
			remove = true;

		while (i < that.data.blocks.length) {
			if (that.data.blocks[i].id === id) {
				if (that.onBlockRemove instanceof Function)
					remove = that.onBlockRemove(that, that.data.blocks[i]);

				if (remove !== false) {
					that.data.blocks[i].Remove();

					delete that.data.blocks[i];
					that.data.blocks.splice(i, 1);
				}
			}

			i++;
		}

		return that;
	};

	/**
	 * @param {string} id
	 *
	 * @returns {Flowprint.Link|null}
	 */
	that.Link = function (id) {
		var i = 0;

		while (i < that.data.links.length) {
			if (that.data.links[i].id === id)
				return that.data.links[i];

			i++;
		}

		return null;
	};

	/**
	 * @param {Flowprint.Link|*} data
	 * @param {Function=} callback
	 *
	 * @return {Flowprint}
	 */
	that.LinkAdd = function (data, callback) {
		if (!init) opt.data.blocks.push(data);
		else {
			if (!(data instanceof Flowprint.Link))
				data = new Flowprint.Link(Flowprint._extend(data, {
					_init: false
				}));

			var link = data.Events(opt.eventsLink),
				p1 = that.Pin(link.p1),
				p2 = that.Pin(link.p2),
				add = true;

			if (opt.options.pinKindAuto && link.kind == null) {
				if (p2 != null) link.kind = p2.kind;
				if (p1 != null) link.kind = p1.kind;
			}

			link = link.Init();

			if (that.onLinkAdd instanceof Function)
				add = that.onLinkAdd(that, link);

			if (add !== false) {
				if (p1 != null) p1.Fill(link.id);
				if (p2 != null) p2.Fill(link.id);

				that.Elem
					.querySelector('.flowprint')
					.querySelector('.flowprint-layer.canvas')
					.appendChild(link.Container());

				that.data.links.push(link);

				if (callback instanceof Function)
					callback(link.id, that);
			}
		}

		return that;
	};

	/**
	 * @param {string} id
	 *
	 * @returns {Flowprint}
	 */
	that.LinkRemove = function (id) {
		var i = 0,
			remove = true;

		while (i < that.data.links.length) {
			if (that.data.links[i].id === id) {
				if (that.onLinkRemove instanceof Function)
					remove = that.onLinkRemove(that, that.data.links[i]);

				if (remove !== false) {
					var p1 = that.Pin(that.data.links[i].p1),
						p2 = that.Pin(that.data.links[i].p2);

					if (p1 != null) p1.Empty();
					if (p2 != null) p2.Empty();

					that.data.links[i].Remove();

					delete that.data.links[i];
					that.data.links.splice(i, 1);
				}
			}

			i++;
		}

		return that;
	};

	/**
	 * @param {string} id
	 *
	 * @returns {Flowprint.Pin|null}
	 */
	that.Pin = function (id) {
		var i = 0, pin = null;

		while (i < that.data.blocks.length) {
			pin = that.data.blocks[i].Pin(id);

			if (pin != null) return pin;

			i++;
		}

		return null;
	};

	/**
	 * @returns {object}
	 */
	that.Data = function () {
		var out = {},
			key = null,
			i = 0;

		for (key in that.data) {
			out[key] = [];

			i = 0;

			while (i < that.data[key].length) {
				out[key].push(that.data[key][i].Data());

				i++;
			}
		}

		return out;
	};

	if (opt.init)
		that.Init();
};

Flowprint._ids = 0;

/**
 * @param {object} target
 * @param {object} defaults
 *
 * @returns {object}
 */
Flowprint._extend = function (target, defaults) {
	target = target || {};

	var k, out = target.constructor === Array ? target.slice() : Object.assign({}, target);

	for (k in defaults) {
		if (defaults[k] !== undefined && defaults[k] !== null && (defaults[k].constructor === Object || defaults[k].constructor === Array))
			out[k] = Flowprint._extend(target[k], defaults[k]);
		else out[k] = target[k] === undefined ? defaults[k] : target[k];
	}

	return out;
};

/**
 * @param {string} tag
 * @param {object=} attributes
 * @param {object=} events
 *
 * @returns {SVGElement}
 */
Flowprint._svg = function (tag, attributes, events) {
	var element = document.createElementNS('http://www.w3.org/2000/svg', tag),
		key = null;

	if (typeof attributes == 'object') {
		key = null;

		for (key in attributes)
			if (attributes[key] !== null)
				element.setAttribute(key, attributes[key].toString());
	}

	if (typeof events == 'object') {
		key = null;

		for (key in events)
			if (events[key] instanceof Function)
				element.addEventListener(key, events[key]);
	}

	return element;
};

/**
 * https://stackoverflow.com/a/25709375/2097055
 *
 * @param {object} opt
 *
 * @returns {{"background-size": string, "background": string}}
 */
Flowprint._cssGrid = function (opt) {
	opt = Flowprint._extend(opt, {
		step: null,
		width: null,
		color: null,
		small: {
			step: null,
			width: null,
			color: null,
			h: {
				step: null,
				width: null,
				color: null
			},
			v: {
				step: null,
				width: null,
				color: null
			}
		},
		big: {
			step: null,
			width: null,
			color: null,
			h: {
				step: null,
				width: null,
				color: null
			},
			v: {
				step: null,
				width: null,
				color: null
			}
		}
	});

	var ssh = opt.step,
		ssv = opt.step,
		sbh = opt.step,
		sbv = opt.step,
		wsh = opt.width,
		wsv = opt.width,
		wbh = opt.width,
		wbv = opt.width,
		csh = opt.color,
		csv = opt.color,
		cbh = opt.color,
		cbv = opt.color;

	if (opt.small.step !== null) {
		ssh = opt.small.step;
		ssv = opt.small.step;
	}
	if (opt.small.h.step !== null) ssh = opt.small.h.step;
	if (opt.small.v.step !== null) ssv = opt.small.v.step;

	if (opt.big.step !== null) {
		sbh = opt.big.step;
		sbv = opt.big.step;
	}
	if (opt.big.h.step !== null) sbh = opt.big.h.step;
	if (opt.big.v.step !== null) sbv = opt.big.v.step;


	if (opt.small.width !== null) {
		wsh = opt.small.width;
		wsv = opt.small.width;
	}
	if (opt.small.h.width !== null) wsh = opt.small.h.width;
	if (opt.small.v.width !== null) wsv = opt.small.v.width;

	if (opt.big.width !== null) {
		wbh = opt.big.width;
		wbv = opt.big.width;
	}
	if (opt.big.h.width !== null) wbh = opt.big.h.width;
	if (opt.big.v.width !== null) wbv = opt.big.v.width;


	if (opt.small.color !== null) {
		csh = opt.small.color;
		csv = opt.small.color;
	}
	if (opt.small.h.color !== null) csh = opt.small.h.color;
	if (opt.small.v.color !== null) csv = opt.small.v.color;

	if (opt.big.color !== null) {
		cbh = opt.big.color;
		cbv = opt.big.color;
	}
	if (opt.big.h.color !== null) cbh = opt.big.h.color;
	if (opt.big.v.color !== null) cbv = opt.big.v.color;

	return {
		'background': ''
			+ 'linear-gradient(-90deg, ' + csv + ' ' + wsv + ', transparent ' + wsv + '),'
			+ 'linear-gradient('         + csh + ' ' + wsh + ', transparent ' + wsh + '),'
			+ 'linear-gradient(-90deg, ' + cbv + ' ' + wbv + ', transparent ' + wbv + '),'
			+ 'linear-gradient('         + cbh + ' ' + wbh + ', transparent ' + wbh + ')',
		'background-size': ''
			+ ssv + ' ' + ssh + ','
			+ ssv + ' ' + ssh + ','
			+ sbv + ' ' + sbh + ','
			+ sbv + ' ' + sbh
	};
};

/**
 * Flowprint primitive prototype
 */
Flowprint._primitive = {
	/**
	 * @param {object} events
	 *
	 * @returns {Flowprint.Block|Flowprint.Link}
	 */
	Events: function (events) {
		var event = null;

		for (event in events)
			if (event.substr(0, 2) === 'on' && this[event] !== undefined)
				this[event] = events[event];

		return this;
	},

	/**
	 * @returns {object}
	 */
	_data: function () {
		var out = {}, key = null;

		for (key in this)
			if (!(this[key] instanceof Function) && key.substr(0, 2) !== 'on')
				out[key] = this[key];

		return out;
	}
};

Flowprint._primitive.Data = Flowprint._primitive._data;

/**
 * @param {object} opt
 *
 * @constructor
 */
Flowprint.Block = function (opt) {
	opt = Flowprint._extend(opt, {
		id: null,
		class: '',
		x: 0,
		y: 0,
		kind: Flowprint.Block.Kind.Generic,
		kindMapped: '',
		kindOptions: {},
		properties: [],
		onInit: null,
		onMove: null,
		onClick: null,
		onPointerDown: null,
		onPointerUp: null,
		onPointerOver: null,
		onPointerOut: null,
		eventsPin: {},
		_init: true
	});

	var that = this,
		kind = new (opt.kind)();

	that.id = opt.id;
	that.x = opt.x;
	that.y = opt.y;
	that.kindMapped = opt.kindMapped;
	that.properties = opt.properties;
	that.onInit = opt.onInit;
	that.onMove = opt.onMove;
	that.onClick = opt.onClick;
	that.onPointereDown = opt.onPointerDown;
	that.onPointerUp = opt.onPointerUp;
	that.onPointerOver = opt.onPointerOver;
	that.onPointerOut = opt.onPointerOut;

	if (that.id === null) {
		that.id = 'flowprint-block-' + Flowprint.Block._ids;

		Flowprint.Block._ids++;
	}

	var container = null,
		pins = [];

	/**
	 * @returns {Flowprint.Block}
	 */
	that.Init = function () {
		container = kind.Init(opt, {
			click: function (e) { if (that.onClick instanceof Function) that.onClick(that, e); },
			pointerdown: function (e) { if (that.onPointerDown instanceof Function) that.onPointerDown(that, e); },
			pointerup: function (e) { if (that.onPointerUp instanceof Function) that.onPointerUp(that, e); },
			pointerover: function (e) { if (that.onPointerOver instanceof Function) that.onPointerOver(that, e); },
			pointerout: function (e) { if (that.onPointerOut instanceof Function) that.onPointerOut(that, e); }
		}, opt.eventsPin, function (pin) {
			pins.push(pin);
		});

		if (that.onInit instanceof Function)
			that.onInit(that);

		return that;
	};

	/**
	 * @returns {SVGElement}
	 */
	that.Container = function () {
		return container;
	};

	/**
	 * @returns {number}
	 */
	that.Width = function () {
		return container.offsetWidth;
	};

	/**
	 * @returns {number}
	 */
	that.Height = function () {
		return container.offsetHeight;
	};

	/**
	 * @returns {Flowprint.Block}
	 */
	that.Remove = function () {
		that.Container().parentNode.removeChild(that.Container());

		return that;
	};

	/**
	 * @param {number} x
	 * @param {number} y
	 *
	 * @returns {Flowprint.Block}
	 */
	that.Move = function (x, y) {
		var move = true;

		if (that.onMove instanceof Function)
			move = that.onMove(that, x, y);

		if (move !== false) {
			that.x = x;
			that.y = y;

			that.Container().style.left = x + 'px';
			that.Container().style.top = y + 'px';
		}

		return that;
	};

	/**
	 * @returns {Flowprint.Pin[]}
	 */
	that.Pins = function () {
		return pins;
	};

	/**
	 * @param {string} id
	 *
	 * @returns {Flowprint.Pin|null}
	 */
	that.Pin = function (id) {
		var i = 0;

		while (i < pins.length) {
			if (pins[i].id === id)
				return pins[i];

			i++;
		}

		return null;
	};

	/**
	 * @returns {*}
	 */
	that.Data = function () {
		var out = that._data(),
			i = 0;

		out.pins = [];

		while (i < pins.length) {
			out.pins.push(pins[i].Data());

			i++;
		}

		return out;
	};

	if (opt._init)
		that.Init();
};

Flowprint.Block.prototype = Flowprint._primitive;
Flowprint.Block._ids = 0;

/**
 * @param {HTMLElement} element
 *
 * @returns {HTMLElement}
 */
Flowprint.Block._node = function (element) {
	if (element === null) return null;

	var block = null;
	if (element.classList.contains('flowprint-block')) block = element;
	if (element.classList.contains('flowprint-block-header')) block = element.parentNode;
	if (element.classList.contains('flowprint-block-body')) block = element.parentNode;
	if (element.classList.contains('flowprint-block-content')) block = element.parentNode.parentNode;

	return block;
};

/**
 * @constructor
 */
Flowprint.Block.Kind = function () {
	/**
	 * @param {object} opt
	 * @param {object} eventsBlock
	 * @param {object} eventsPin
	 * @param {Function} pinCreated
	 *
	 * @return {HTMLElement}
	 */
	this.Init = function (opt, eventsBlock, eventsPin, pinCreated) { };
};

/**
 * https://bobbyhadz.com/blog/javascript-set-position-of-element
 *
 * @constructor
 */
Flowprint.Block.Kind.Generic = function () {
	/**
	 * @param {object} opt
	 * @param {object} eventsBlock
	 * @param {object} eventsPin
	 * @param {Function} pinCreated
	 *
	 * @return {HTMLElement}
	 */
	this.Init = function (opt, eventsBlock, eventsPin, pinCreated) {
		opt = Flowprint._extend(opt, {
			kindOptions: {
				header: {
					use: true,
					content: null,
					pins: {
						in: [],
						out: []
					}
				},
				body: {
					use: true,
					content: null,
					pins: {
						in: [],
						out: []
					}
				}
			}
		});

		var element = document.createElement('div');

		element.setAttribute('class', 'flowprint-block' + (opt.class != '' ? ' ' + opt.class : ''));
		element.setAttribute('id', opt.id);
		element.style.left = opt.x + 'px';
		element.style.top = opt.y + 'px';

		element.innerHTML = '';

		if (opt.kindOptions.header.use)
			element.innerHTML += ''
				+ '<div class="flowprint-block-header">'
				+ '<div class="flowprint-pin-container input"></div>'
				+ '<div class="flowprint-block-content">' + (opt.kindOptions.header.content === null ? '' : opt.kindOptions.header.content) + '</div>'
				+ '<div class="flowprint-pin-container output"></div>'
				+ '</div>';

		if (opt.kindOptions.body.use)
			element.innerHTML += ''
				+ '<div class="flowprint-block-body">'
				+ '<div class="flowprint-block-content">' + (opt.kindOptions.body.content === null ? '' : opt.kindOptions.body.content) + '</div>'
				+ '<div class="flowprint-pin-container input"></div>'
				+ '<div class="flowprint-block-spacer"></div>'
				+ '<div class="flowprint-pin-container output"></div>'
				+ '</div>';

		var containers = element.querySelectorAll('.flowprint-pin-container'),
			i = 0,
			j = 0,
			k = 0,
			pin = null,
			type = null,
			types = {
				input: 'in',
				output: 'out'
			},
			target = null,
			targets = ['header', 'body'];

		j = 0;

		while (j < targets.length) {
			target = targets[j];

			for (type in types) {
				if (!opt.kindOptions[target] || !(opt.kindOptions[target].pins[types[type]] instanceof Array)) continue;

				k = 0;

				while (k < opt.kindOptions[target].pins[types[type]].length) {
					pin = new Flowprint.Pin(Flowprint._extend(opt.kindOptions[target].pins[types[type]][k], {
						events: eventsPin,
						direction: {
							in: type === 'input',
							out: type === 'output'
						},
						place: target,
						_init: false
					}));


					i = 0;

					while (i < containers.length) {
						if (containers[i].parentNode.classList.contains('flowprint-block-' + target) && containers[i].classList.contains(type)) {
							containers[i].append(pin.Init().Container());

							if (pinCreated instanceof Function)
								pinCreated(pin);
						}

						i++;
					}

					k++;
				}
			}

			j++;
		}

		var event = null;
		for (event in eventsBlock)
			element.addEventListener(event, eventsBlock[event]);

		return element;
	};
};

Flowprint.Block.Kind.Generic.prototype = Flowprint.Block.Kind;

/**
 * @param {object} opt
 *
 * @constructor
 */
Flowprint.Link = function (opt) {
	opt = Flowprint._extend(opt, {
		id: null,
		class: '',
		x: null,
		y: null,
		x1: null,
		y1: null,
		x2: null,
		y2: null,
		kind: null,
		type: Flowprint.Link.Type.Bezier,
		onInit: null,
		onMove: null,
		onMoveEnd1: null,
		onMoveEnd2: null,
		onClick: null,
		onPointerDown: null,
		onPointerUp: null,
		onPointerOver: null,
		onPointerOut: null,
		visible: true,
		_init: true,
		_yCorrection: 0//2//9
	});

	var that = this,
		type = new (opt.type)();

	that.id = opt.id;
	that.x1 = opt.x1;
	that.y1 = opt.y1;
	that.x2 = opt.x2;
	that.y2 = opt.y2;
	that.p1 = opt.p1;
	that.p2 = opt.p2;
	that.kind = opt.kind;
	that.onInit = opt.onInit;
	that.onMove = opt.onMove;
	that.onMoveEnd1 = opt.onMoveEnd1;
	that.onMoveEnd2 = opt.onMoveEnd2;
	that.onClick = opt.onClick;
	that.onPointerDown = opt.onPointerDown;
	that.onPointerUp = opt.onPointerUp;
	that.onPointerOver = opt.onPointerOver;
	that.onPointerOut = opt.onPointerOut;

	if (that.id === null) {
		that.id = 'flowprint-link-' + Flowprint.Link._ids;

		Flowprint.Link._ids++;
	}

	if (opt.x !== null) {
		if (opt.x1 === null) that.x1 = opt.x;
		if (opt.x2 === null) that.x2 = opt.x;
	}

	if (opt.y !== null) {
		if (opt.y1 === null) that.y1 = opt.y;
		if (opt.y2 === null) that.y2 = opt.y;
	}

	if (opt.p1 !== undefined) {
		var p1 = Flowprint.Pin._node(document.getElementById(opt.p1));

		if (opt.x1 === null) that.x1 = p1 === null ? 0 : p1.x;
		if (opt.y1 === null) that.y1 = p1 === null ? 0 : p1.y + opt._yCorrection;
	}

	if (opt.p2 !== undefined) {
		var p2 = Flowprint.Pin._node(document.getElementById(opt.p2));

		if (opt.x2 === null) that.x2 = p2 === null ? 0 : p2.x;
		if (opt.y2 === null) that.y2 = p2 === null ? 0 : p2.y + opt._yCorrection;
	}

	that.x1 = parseInt(that.x1);
	that.y1 = parseInt(that.y1);
	that.x2 = parseInt(that.x2);
	that.y2 = parseInt(that.y2);

	var container = null;

	/**
	 * @returns {Flowprint.Link}
	 */
	that.Init = function () {
		var attributes = {
			id: that.id,
			class: 'flowprint-link ' + opt.class,
			'data-kind': that.kind
		};

		container = type.Init(attributes, that.x1, that.y1, that.x2, that.y2, {
			click: function (e) { if (that.onClick instanceof Function) that.onClick(that, e); },
			pointerdown: function (e) { if (that.onPointerDown instanceof Function) that.onPointerDown(that, e); },
			pointerup: function (e) { if (that.onPointerUp instanceof Function) that.onPointerUp(that, e); },
			pointerover: function (e) { if (that.onPointerOver instanceof Function) that.onPointerOver(that, e); },
			pointerout: function (e) { if (that.onPointerOut instanceof Function) that.onPointerOut(that, e); }
		});

		that.Visible(opt.visible);

		if (that.onInit instanceof Function)
			that.onInit(that);

		return that;
	};

	/**
	 * @returns {SVGElement}
	 */
	that.Container = function () {
		return container;
	};

	/**
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 * @param {string} p1
	 * @param {string} p2
	 *
	 * @returns {Flowprint.Link}
	 */
	that.Move = function (x1, y1, x2, y2, p1, p2) {
		var move = true;
		if (that.onMove instanceof Function)
			move = that.onMove(that, x1, y1, x2, y2);

		if (move !== false) {
			that.x1 = x1;
			that.y1 = y1;
			that.x2 = x2;
			that.y2 = y2;

			if (p1 !== undefined) that.p1 = p1;
			if (p2 !== undefined) that.p2 = p2;

			type.Move(container, that.x1, that.y1, that.x2, that.y2);
		}

		return that;
	};

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {string=} p
	 *
	 * @returns {Flowprint.Link}
	 */
	that.MoveEnd1 = function (x, y, p) {
		var move = true;
		if (that.onMoveEnd1 instanceof Function)
			move = that.onMoveEnd1(that, x, y, p);

		if (move !== false)
			that.Move(x, y, that.x2, that.y2, p, that.p2);

		return that;
	};

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {string=} p
	 *
	 * @returns {Flowprint.Link}
	 */
	that.MoveEnd2 = function (x, y, p) {
		var move = true;
		if (that.onMoveEnd2 instanceof Function)
			move = that.onMoveEnd2(that, x, y, p);

		if (move !== false)
			that.Move(that.x1, that.y1, x, y, that.p1, p);

		return that;
	};

	/**
	 * @param {boolean} visible
	 *
	 * @returns {Flowprint.Link}
	 */
	that.Visible = function (visible) {
		container.style.display = visible ? 'block' : 'none';

		return that;
	};

	/**
	 * @returns {Flowprint.Link}
	 */
	that.Remove = function () {
		container.parentNode.removeChild(container);

		return that;
	};

	/**
	 * @param {string} name
	 *
	 * @returns {Flowprint.Link}
	 */
	that.AddClass = function (name) {
		that.Container().classList.add(name);

		return that;
	};

	/**
	 * @param {string} name
	 *
	 * @returns {boolean}
	 */
	that.HasClass = function (name) {
		return that.Container().classList.contains(name);
	};

	/**
	 * @param {string} name
	 *
	 * @returns {Flowprint.Link}
	 */
	that.RemoveClass = function (name) {
		that.Container().classList.remove(name);

		return that;
	};

	if (opt._init)
		that.Init();
};

Flowprint.Link.prototype = Flowprint._primitive;
Flowprint.Link._ids = 0;

/**
 * @constructor
 */
Flowprint.Link.Type = function () {
	/**
	 * @param {object} attributes
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 * @param {object} events
	 *
	 * @return {SVGElement}
	 */
	this.Init = function (attributes, x1, y1, x2, y2, events) { };

	/**
	 * @param {SVGElement} element
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 */
	this.Move = function (element, x1, y1, x2, y2) { };
};

/**
 * @constructor
 */
Flowprint.Link.Type.Line = function () {
	/**
	 * @param {object} attributes
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 * @param {object} events
	 *
	 * @return {SVGElement}
	 */
	this.Init = function (attributes, x1, y1, x2, y2, events) {
		return Flowprint._svg('line', Flowprint._extend(attributes, {
			x1: x1,
			y1: y1,
			x2: x2,
			y2: y2
		}), events);
	};

	/**
	 * @param {SVGElement} element
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 */
	this.Move = function (element, x1, y1, x2, y2) {
		element.setAttribute('x1', x1.toString());
		element.setAttribute('y1', y1.toString());
		element.setAttribute('x2', x2.toString());
		element.setAttribute('y2', y2.toString());
	};
};

Flowprint.Link.Type.Line.prototype = Flowprint.Link.Type;

/**
 * https://github.com/sdrdis/jquery.flowchart
 *
 * @constructor
 */
Flowprint.Link.Type.Bezier = function () {
	/**
	 * @param {object} attributes
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 * @param {object} events
	 *
	 * @return {SVGElement}
	 */
	this.Init = function (attributes, x1, y1, x2, y2, events) {
		var container = Flowprint._svg('g', attributes, events),
			path = Flowprint._svg('path', {
				d: Flowprint.Link.Type.Bezier.Descriptor(x1, y1, x2, y2)
			});

		container.appendChild(path);

		return container;
	};

	/**
	 * @param {SVGElement} element
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 */
	this.Move = function (element, x1, y1, x2, y2) {
		element.querySelector('path').setAttribute('d', Flowprint.Link.Type.Bezier.Descriptor(x1, y1, x2, y2));
	};
};

Flowprint.Link.Type.Bezier.prototype = Flowprint.Link.Type;

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 *
 * @returns {string}
 */
Flowprint.Link.Type.Bezier.Descriptor = function (x1, y1, x2, y2) {
	var intensity = Math.min(100, Math.max(Math.abs(x1 - x2) / 2, Math.abs(y1 - y2)));

	// vertical
	//return 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + intensity) + ' ' + x2 + ',' + (y2 - intensity) + ' ' + x2 + ',' + y2;

	// horizontal
	return 'M' + x1 + ',' + y1 + ' C' + (x1 + intensity) + ',' + y1 + ' ' + (x2 - intensity) + ',' + y2 + ' ' + x2 + ',' + y2;
};

Flowprint.Link.Kind = {
	NEW: 'new',
	FLOW: 'flow',
	LINK: 'link'
};

/**
 * @param {object} opt
 *
 * @constructor
 */
Flowprint.Pin = function (opt) {
	opt = Flowprint._extend(opt, {
		id: null,
		class: '',
		direction: {
			in: false,
			out: false
		},
		place: '',
		kind: null,
		content: null,
		onInit: null,
		onFill: null,
		onEmpty: null,
		onClick: null,
		onPointerDown: null,
		onPointerUp: null,
		onPointerOver: null,
		onPointerOut: null,
		_init: true
	});

	if (typeof opt.kind === 'string')
		opt.kind = Flowprint.Pin.Kind[Flowprint.Pin.Kind._[opt.kind]];

	if (!(opt.kind instanceof Function))
		opt.kind = Flowprint.Pin.Kind.Generic;

	var that = this,
		kind = new (opt.kind)();

	that.id = opt.id;
	that.content = opt.content;
	that.direction = opt.direction;
	that.place = opt.place;
	that.kind = kind.Name;
	that.onInit = opt.events.onInit;
	that.onFill = opt.events.onFill;
	that.onEmpty = opt.events.onEmpty;
	that.onClick = opt.events.onClick;
	that.onPointerDown = opt.events.onPointerDown;
	that.onPointerUp = opt.events.onPointerUp;
	that.onPointerOver = opt.events.onPointerOver;
	that.onPointerOut = opt.events.onPointerOut;

	if (that.id === null) {
		that.id = 'flowprint-pin-' + Flowprint.Pin._ids;

		Flowprint.Pin._ids++;
	}

	var container = null;

	/**
	 * @returns {Flowprint.Pin}
	 */
	that.Init = function () {
		container = kind.Init(opt);

		that.Events({
			click: function (e) { if (that.onClick instanceof Function) that.onClick(that, e); },
			pointerdown: function (e) { if (that.onPointerDown instanceof Function) that.onPointerDown(that, e); },
			pointerup: function (e) { if (that.onPointerUp instanceof Function) that.onPointerUp(that, e); },
			pointerover: function (e) { if (that.onPointerOver instanceof Function) that.onPointerOver(that, e); },
			pointerout: function (e) { if (that.onPointerOut instanceof Function) that.onPointerOut(that, e); }
		});

		if (that.onInit instanceof Function)
			that.onInit(that);

		return that;
	};

	/**
	 * @returns {SVGElement}
	 */
	that.Container = function () {
		return container;
	};

	/**
	 * @returns {{x: number, y: number, element: *}|null}
	 */
	that.Position = function () {
		return Flowprint.Pin._node(container);
	};

	/**
	 * @param {string=} link
	 *
	 * @returns {Flowprint.Pin}
	 */
	that.Fill = function (link) {
		var fill = true;

		if (that.onFill instanceof Function)
			fill = that.onFill(that, link);

		if (fill !== false) {
			container.classList.add('fill');

			if (link !== undefined)
				container.dataset.link = link;
		}

		return that;
	};

	/**
	 * @returns {Flowprint.Pin}
	 */
	that.Empty = function () {
		var empty = true;

		if (that.onEmpty instanceof Function)
			empty = that.onEmpty(that);

		if (empty !== false) {
			container.classList.remove('fill');

			if (container.dataset.link !== undefined)
				delete container.dataset.link;
		}

		return that;
	};

	if (opt._init)
		that.Init();
};

Flowprint.Pin.prototype = Flowprint._primitive;
Flowprint.Pin._ids = 0;

/**
 * @param {*} element
 *
 * @returns {null|{x: number, y: number, element: *}}
 */
Flowprint.Pin._node = function (element) {
	if (element === null) return null;

	var isHandle = element.classList.contains('flowprint-pin-handle');
	if (!element.classList.contains('flowprint-pin') && !isHandle) return null;

	if (isHandle)
		element = element.parentNode;

	var elementHandle = element.querySelector('.flowprint-pin-handle'),
		elementBlock = element.parentNode.parentNode.parentNode;

	return {
		element: element,
		x: elementBlock.offsetLeft + element.offsetLeft + elementHandle.offsetLeft + (elementHandle.offsetWidth / 2),
		y: elementBlock.offsetTop + element.offsetTop + elementHandle.offsetTop + (elementHandle.offsetHeight / 2)
	};
};

/**
 * @constructor
 */
Flowprint.Pin.Kind = function () {
	/**
	 * @type {string} name
	 */
	this.Name = '';

	/**
	 * @param {object} opt
	 */
	this.Init = function (opt) { };
};

Flowprint.Pin.Kind._ = {
	flow: 'Flow',
	value: 'Value'
};

/**
 * @param {string} kind
 * @param {string} id
 * @param {string|null} content
 *
 * @returns {HTMLDivElement}
 */
Flowprint.Pin.Kind._html = function (kind, id, content) {
	var pin = document.createElement('div');

	pin.setAttribute('id', id);
	pin.setAttribute('class', 'flowprint-pin');
	pin.setAttribute('data-kind', kind);

	pin.innerHTML = '<a class="flowprint-pin-handle"></a>' + (content === null ? '' : content);

	return pin;
};

/**
 * @constructor
 */
Flowprint.Pin.Kind.Generic = function () {
	/**
	 * @type {string} name
	 */
	this.Name = '';

	/**
	 * @param {object} opt
	 *
	 * @return {HTMLElement}
	 */
	this.Init = function (opt) {
		return Flowprint.Pin.Kind._html(opt.class, opt.id, opt.content);
	};
};

Flowprint.Pin.Kind.Generic.prototype = Flowprint.Pin.Kind;

/**
 * @constructor
 */
Flowprint.Pin.Kind.Flow = function () {
	/**
	 * @type {string} name
	 */
	this.Name = Flowprint.Pin.Kind._.flow.toLowerCase();

	/**
	 * @param {object} opt
	 *
	 * @return {HTMLElement}
	 */
	this.Init = function (opt) {
		return Flowprint.Pin.Kind._html('flow', opt.id, opt.content);
	};
};

Flowprint.Pin.Kind.Flow.prototype = Flowprint.Pin.Kind;

/**
 * @constructor
 */
Flowprint.Pin.Kind.Value = function () {
	/**
	 * @type {string} name
	 */
	this.Name = Flowprint.Pin.Kind._.value.toLowerCase();

	/**
	 * @param {object} opt
	 *
	 * @return {HTMLElement}
	 */
	this.Init = function (opt) {
		return Flowprint.Pin.Kind._html('value', opt.id, opt.content);
	};
};

Flowprint.Pin.Kind.Value.prototype = Flowprint.Pin.Kind;