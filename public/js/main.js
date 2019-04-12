var _cy;
var nodes, edges;
var firstUnit, lastUnit, phantoms = {}, phantomsTop = {}, notStable = [];
var nextPositionUpdates;
var generateOffset = 0, newOffset = -116, oldOffset;
var activeNode, waitGo;
var notLastUnitUp = false, notLastUnitDown = true;
var lastActiveUnit;
var page, isInit = false;
var queueAnimationPanUp = [], animationPlaysPanUp = false;

var current_round_index = -1;

function init(_nodes, _edges) {
	nodes = _nodes;
	edges = _edges;
	firstUnit = nodes[0].rowid;
	lastUnit = nodes[nodes.length - 1].rowid;
	phantoms = {};
	phantomsTop = {};
	notStable = [];
	nextPositionUpdates = null;
	generateOffset = 0;
	newOffset = -116;
	notLastUnitUp = false;
	notLastUnitDown = true;
	activeNode = null;
	waitGo = null;
	createCy();
	generate(_nodes, _edges);


	//console.log(_cy.nodes()[0]);

	oldOffset = _cy.getElementById(nodes[0].data.unit).position().x + 66;
	_cy.viewport({zoom: 1.01}); // cy.viewport( zoom, pan )
	_cy.center(_cy.nodes()[0]);
	_cy.panBy({x: -300, y: 0});
	page = 'dag';

	if (location.hash && location.hash.length == 45) {
		notLastUnitUp = true;
		//highlightNode(location.hash.substr(1));
	}
	isInit = true;
}

function start() {
	if (!location.hash || (location.hash.length != 45 && location.hash.length != 33)) {
		socket.emit('start', {type: 'last'});
	}
	// else if (location.hash.length == 45) {
	// 	socket.emit('start', {type: 'unit', unit: location.hash.substr(1)});
	// 	notLastUnitUp = true;
	// }
	// else if (location.hash.length == 33) {
	// 	socket.emit('start', {type: 'address', address: location.hash.substr(1)});
	// 	$('#addressInfo').show();
	// }
}

function createCy() {
	_cy = cytoscape({
		container: document.getElementById('cy'),
		boxSelectionEnabled: true,
		autounselectify: true,
		hideEdgesOnViewport: false,
		// layout: {
		// 	name: 'dagre',
		// 	rankDir: 'LR',
		// 	align: 'LR'
		// },
		style: [
			{
				selector: 'node',
				style: {
					'text-opacity': 1,
					'min-zoomed-font-size': 12,
					'text-valign': 'top',
					'text-halign': 'center',
					'font-size': '12px',
					'text-margin-y': '-5px',
					'background-color': '#BAE0FF', // 浅色   #3192F2', // 深色
					'shape': 'circle',
					'width': 36,
					'height': 36,

					'background-width': '45%',
					'background-height': '45%',
					'background-image-opacity': 0.9
				}
			},

			// 在主链上
			{
				selector: '.is_on_main_chain',
				style: { 'background-image': '/img/unitsW.png' }
			},
			// is_pow
			{
				selector: '.is_pow',
				style: { 'background-image': '/img/trustmeW.png' }
			},
			// is_trustme
			{
				selector: '.is_trustme',
				style: { 'background-image': '/img/powW.png' }
			},
			// is_coinbase
			{
				selector: '.is_coinbase',
				style: { 'background-image': '/img/coinbaseW.png' }
			},
			// 稳定
			{
				selector: '.is_stable',
				style: {	}
			},
			// 全部节点 深色
			{
				selector: '.all_nodes_change_to_dark',
				style: {
					'background-color': '#3192F2'
				}
			},
			// 失败
			{
				selector: '.finalBad',
				style: {
					'background-color': '#FD955E',
				}
			},
			// 失败
			{
				selector: '.tempBad',
				style: {
					'background-color': '#FD955E'
				}
			},


			// 箭头
			{
				selector: 'edge',
				style: {
					'width': 2,
					'target-arrow-shape': 'triangle',
					'line-color': '#B8DCFF',
					'target-arrow-color': '#B8DCFF',
					'curve-style': 'bezier',
				}
			},
			// 指向最优父节点箭头
			{
				selector: '.best_parent_unit',
				style: {
					'width': 4,
					'target-arrow-shape': 'triangle',
					'line-color': '#3192F2', //B8DCFF
					'target-arrow-color': '#3192F2',
					'curve-style': 'bezier',
				}
			},
			// hover 样式
			{
				selector: 'node.hover',
				style: {
					//'content': 'data(unit_s)',
					'background-color': '#9EEAE1',
					'border-color': '#9EEAE1',
				}
			}
		],
		elements: {
			nodes: [],
			edges: []
		}
	});

	// 选择类型
	_cy.on('choosenIfOnMainChian', clickToChoosen);

	// node hover 时显示浮窗
	_cy.on('mouseover', 'node', function () {
		this.addClass('hover');
		//console.log(this);
		//console.log(this._private.classes);
		var _this = this;
		
		function getMousePos(event) {
			var e = event || window.event;
			//console.log(e.clientX+'******'+e.clientY+scrollY);
			$("#nodeDetails").css('display','block').css('top', Math.abs(e.clientY+scrollY)).css('left', Math.abs(e.clientX)+20);
			if(_this._private.classes.is_pow){
				$("#statusIsPow").css('display','block');
				$("#statusIsTrustme").css('display','none');
				$("#statusIsCoinbase").css('display','none');
			}
			if(_this._private.classes.is_trustme){
				$("#statusIsTrustme").css('display','block');
				$("#statusIsPow").css('display','none');
				$("#statusIsCoinbase").css('display','none');
			}
			if(_this._private.classes.is_coinbase){
				$("#statusIsCoinbase").css('display','block');
				$("#statusIsPow").css('display','none');
				$("#statusIsTrustme").css('display','none');
			}

			if(_this._private.classes.is_stable){
				$("#statusIsStable").css('display','block');
			}
			if(_this._private.classes.is_on_main_chain_empty){
				$("#statusIsMainChain").css('display','block');
			}

			if(_this._private.classes.is_pow || _this._private.classes.is_trustme || _this._private.classes.is_coinbase){
				$("#statusIsIssued").css('display','block');
				$("#statusIsIssuedTxT").text(_this._private.data.round_index);
			}
		};
		getMousePos();
		
	});
	_cy.on('mouseout', 'node', function () {
		this.removeClass('hover');
		$("#nodeDetails").css('display','none');
		$("#statusIsCoinbase").css('display','none');
		$("#statusIsPow").css('display','none');
		$("#statusIsTrustme").css('display','none');

		$("#statusIsStable").css('display','none');
		$("#statusIsMainChain").css('display','none');

		$("#statusIsIssued").css('display','none');
	});

	// 点击 node 跳转到 详细页面
	_cy.on('mousedown', 'node', function (evt) {
		this.addClass('press');
		location.href = './detail#' +  evt.cyTarget.id();
	});
	_cy.on('mouseup', 'node', function () {
		this.removeClass('press');
	});


	// 页面 扩展（ 向后面拖拽 ）
	_cy.on('pan', function () {
		var ext = _cy.extent();
		if (nextPositionUpdates < ext.x2) {
			getNext();
		}
		else if (notLastUnitUp === true && ext.x2 - (ext.w) < _cy.getElementById(nodes[0].data.unit).position().x) {
			getPrev();
		}
		scroll.scrollTop(convertPosPanToPosScroll());
	});

	// 鼠标滚轮
	// $(_cy.container()).on('wheel mousewheel', function (e) {
	// 	var deltaY = e.originalEvent.wheelDeltaY || -e.originalEvent.deltaY;
	// 	if (page == 'dag') {
	// 		e.preventDefault();
	// 		if (deltaY > 0) {
	// 			scrollUp();
	// 		}
	// 		else if (deltaY < 0) {
	// 			_cy.panBy({x: -25, y: 0});
	// 		}
	// 		scroll.scrollTop(convertPosPanToPosScroll());
	// 	}
	// });
}

function clickToChoosen(evt,v) {
	// 非主链
	if (v == 'notMainChain') {
		_cy.nodes().forEach(function (node) {
			node.addClass('all_nodes_change_to_dark');
			if (node.hasClass('is_on_main_chain_empty')) {
				node.removeClass('all_nodes_change_to_dark');
			}
		});
	}
	// 主链
	if (v == 'MainChain') {
		_cy.nodes().forEach(function (node) {
			node.removeClass('all_nodes_change_to_dark');
			if (node.hasClass('is_on_main_chain_empty')) {
				node.addClass('all_nodes_change_to_dark');
			}
		});
	}
	// 稳定
	if (v == 'is_static') {
		_cy.nodes().forEach(function (node) {
			node.removeClass('all_nodes_change_to_dark');
			if (node.hasClass('is_stable')) {
				node.addClass('all_nodes_change_to_dark');
			}
		});
	}

	// is_pow
	if (v == 'is_pow') {
		_cy.nodes().forEach(function (node) {
			node.removeClass('all_nodes_change_to_dark');
			if (node.hasClass('is_pow')) {
				node.addClass('all_nodes_change_to_dark');
			}
		});
	}
	// is_trustme
	if (v == 'is_trustme') {
		_cy.nodes().forEach(function (node) {
			node.removeClass('all_nodes_change_to_dark');
			if (node.hasClass('is_trustme')) {
				node.addClass('all_nodes_change_to_dark');
			}
		});
	}
	// is_coinbase
	if (v == 'is_coinbase') {
		_cy.nodes().forEach(function (node) {
			node.removeClass('all_nodes_change_to_dark');
			if (node.hasClass('is_coinbase')) {
				node.addClass('all_nodes_change_to_dark');
			}
		});
	}
}

function updListNotStableUnit() {
	if (!_cy) return;
	notStable = [];
	_cy.nodes().forEach(function (node) {
		if (!node.hasClass('is_stable')) {
			notStable.push(node.id());
		}
	});
}

function generate(_nodes, _edges) {
	var newOffset_x,
		newOffset_y,
		left = Infinity,
		right = -Infinity,
		first = false,
		generateAdd = [],
		_node,
		classes = '',
		pos_iomc;
	var graph = createGraph(_nodes, _edges);

	// 取值 left：最小值   right：最大值
	graph.nodes().forEach(function (unit) {
		_node = graph.node(unit);
		if (_node) {
			if (_node.y < left) left = _node.y;
			if (_node.y > right) right = _node.y;
		}
	});

	graph.nodes().forEach(function (unit) {
		_node = graph.node(unit);
		if (_node) {
			classes = '';
			if (_node.is_on_main_chain) classes = 'is_on_main_chain';
			if (_node.is_stable) classes += ' is_stable';
			if (_node.pow_type == '1') classes = 'is_pow';
			if (_node.pow_type == '2') classes = 'is_trustme';
			if (_node.pow_type == '3') classes = 'is_coinbase';
			if (_node.sequence === 'final-bad') classes = 'finalBad';
			if (_node.sequence === 'temp-bad') classes = 'tempBad';
			if (_node.is_on_main_chain) classes += ' is_on_main_chain_empty';
			
			if (!first) {
				newOffset_y = -_node.y - ((right - left) / 2);
				newOffset_x = generateOffset - _node.x + 66; // var generateOffset = 0
				first = true;
			}
			if (phantoms[unit] !== undefined) {
				_cy.remove(_cy.getElementById(unit));
				generateAdd.push({
					group: "nodes",
					data: {id: unit, unit_s: _node.label, round_index:_node.round_index},
					position: {y: phantoms[unit], x: _node.x + newOffset_x},
					classes: classes
				});
				delete phantoms[unit];
			}
			else {
				pos_iomc = setMaxWidthNodes(_node.y + newOffset_y);
				if (pos_iomc == 0 && _node.is_on_main_chain == 0) {
					pos_iomc += 40;
				}
				generateAdd.push({
					group: "nodes",
					data: {id: unit, unit_s: _node.label, round_index:_node.round_index},
					position: {y: pos_iomc, x: _node.x + newOffset_x},
					classes: classes
				});
			}
		}
	});
	generateAdd = fixConflicts(generateAdd);
	_cy.add(generateAdd);
	generateOffset = _cy.nodes()[_cy.nodes().length - 1].position().x;
	nextPositionUpdates = generateOffset;
	_cy.add(createEdges());
	updListNotStableUnit();
	updateScrollHeigth();
}

function animationPanUp(distance) {
	if (animationPlaysPanUp) {
		queueAnimationPanUp.push(distance);
	}
	else {
		if (queueAnimationPanUp.length > 1) {
			distance = queueAnimationPanUp.reduce(function (prev, current) {
				return prev + current;
			});
			queueAnimationPanUp = [];
		}
		_cy.stop();
		animationPlaysPanUp = true;
		_cy.animate({
			pan: {
				y: _cy.pan('y'),
				x: _cy.pan('x') + distance
			}
		}, {
			duration: 250,
			complete: function () {
				oldOffset = _cy.getElementById(nodes[0].data.unit).position().x + 66;
				animationPlaysPanUp = false;
				if (queueAnimationPanUp.length) {
					animationPanUp(queueAnimationPanUp[0]);
					queueAnimationPanUp.splice(0, 1);
				}
			}
		});
	}
}

function setNew(_nodes, _edges, newUnits) {
	var newOffset_x,
		newOffset_y,
		min = Infinity,
		max = -Infinity,
		left = Infinity,
		right = -Infinity,
		first = false,
		x,
		y,
		generateAdd = [],
		_node,
		classes = '',
		pos_iomc;
	var graph = createGraph(_nodes, _edges);
	graph.nodes().forEach(function (unit) {
		_node = graph.node(unit);
		if (_node) {
			x = _node.x;
			if (x < min) min = x;
			if (x > max) max = x;
			if (_node.y < left) left = _node.y;
			if (_node.y > right) right = _node.y;
		}
	});
	graph.nodes().forEach(function (unit) {
		_node = graph.node(unit);
		if (_node) {
			classes = '';
			if (_node.is_on_main_chain) classes = 'is_on_main_chain';
			if (_node.is_stable) classes += ' is_stable';
			if (_node.pow_type == '1') classes = 'is_pow';
			if (_node.pow_type == '2') classes = 'is_trustme';
			if (_node.pow_type == '3') classes = 'is_coinbase';
			if (_node.sequence === 'final-bad') classes = 'finalBad';
			if (_node.sequence === 'temp-bad') classes = 'tempBad';
			if (_node.is_on_main_chain) classes += ' is_on_main_chain_empty';

			
			// console.log('*****-----*****',_node.is_on_main_chain)
			if (_node.is_on_main_chain && CurChoosenType == 'MainChain') classes += ' all_nodes_change_to_dark';

			if (!first) {
				newOffset_y = -_node.y - ((right - left) / 2);
				newOffset_x = newOffset - (max - min) + 66;
				newOffset -= (max - min) + 66;
				first = true;
				if (newUnits && _cy.extent().x1 < oldOffset) {
					animationPanUp(max + 54);
				}
			}
			if (phantomsTop[unit] !== undefined) {
				_cy.remove(_cy.getElementById(unit));
				generateAdd.push({
					group: "nodes",
					data: {id: unit, unit_s: _node.label, round_index:_node.round_index},
					position: {y: phantomsTop[unit], x: _node.x + newOffset_x},
					classes: classes
				});
				delete phantomsTop[unit];
			} else {
				pos_iomc = setMaxWidthNodes(_node.y + newOffset_y);
				if (pos_iomc == 0 && _node.is_on_main_chain == 0) {
					pos_iomc += 40;
				}
				generateAdd.push({
					group: "nodes",
					data: {id: unit, unit_s: _node.label, round_index:_node.round_index},
					position: {y: pos_iomc, x: _node.x + newOffset_x},
					classes: classes
				});
			}




			// function weChoosen(v){
			// 	// 非主链
			// 	if (v == 'notMainChain') {
			// 		_node.addClass('all_nodes_change_to_dark');
			// 		if (_node.hasClass('is_on_main_chain_empty')) {
			// 			_node.removeClass('all_nodes_change_to_dark');
			// 		}
			// 	}
			// 	// 主链
			// 	if (v == 'MainChain') {
			// 		_node.removeClass('all_nodes_change_to_dark');
			// 		if (_node.hasClass('is_on_main_chain_empty')) {
			// 			_node.addClass('all_nodes_change_to_dark');
			// 		}
			// 	}
			// 	// 稳定
			// 	if (v == 'is_static') {
			// 		_node.removeClass('all_nodes_change_to_dark');
			// 		if (_node.hasClass('is_stable')) {
			// 			_node.addClass('all_nodes_change_to_dark');
			// 		}
			// 	}
			// 	// is_pow
			// 	if (v == 'is_pow') {
			// 		_node.removeClass('all_nodes_change_to_dark');
			// 		if (_node.hasClass('is_pow')) {
			// 			_node.addClass('all_nodes_change_to_dark');
			// 		}
			// 	}
			// 	// is_trustme
			// 	if (v == 'is_trustme') {
			// 		_node.removeClass('all_nodes_change_to_dark');
			// 		if (_node.hasClass('is_trustme')) {
			// 			_node.addClass('all_nodes_change_to_dark');
			// 		}
			// 	}
			// 	// is_coinbase
			// 	if (v == 'is_coinbase') {
			// 		_node.removeClass('all_nodes_change_to_dark');
			// 		if (_node.hasClass('is_coinbase')) {
			// 			_node.addClass('all_nodes_change_to_dark');
			// 		}
			// 	}
			// }
			// weChoosen('MainChain');


		}
		//console.log(_node)
	});
	generateAdd = fixConflicts(generateAdd);
	_cy.add(generateAdd);
	_cy.add(createEdges());
	updListNotStableUnit();
	updateScrollHeigth();
	// clickToChoosen('MainChain');
}

// 创建图表
function createGraph(_nodes, _edges) {
	var graph = new dagre.graphlib.Graph({
		multigraph: true,
		compound: true,
	});
	graph.setGraph({rankdir: "LR"});
	graph.setDefaultEdgeLabel(function () {
		return {};
	});
	_nodes.forEach(function (node) {
		graph.setNode(node.data.unit, {
			label: node.data.unit_s,
			width: 36,
			height: 36,
			is_on_main_chain: node.is_on_main_chain,
			pow_type: node.pow_type,
			is_stable: node.is_stable,
			sequence: node.sequence
		});
	});
	for (var k in _edges) {
		if (_edges.hasOwnProperty(k)) {
			graph.setEdge(_edges[k].data.source, _edges[k].data.target);
		}
	}
	dagre.layout(graph);
	return graph;
}

function setMaxWidthNodes(x) {
	if (x > 500) {
		return x / (x / 500);
	}
	else if (x < -500) {
		return -((x / (x / 500)));
	}
	else {
		return x;
	}
}

function fixConflicts(arr) {
	var conflicts = {}, a, b, l, l2;
	for (a = 0, l = arr.length; a < l; a++) {
		for (b = 0; b < l; b++) {
			if (a != b && ((arr[a].position.x < arr[b].position.x + 10 && arr[a].position.x > arr[b].position.x - 10) && arr[a].position.y == arr[b].position.y)) {
				if (!conflicts[arr[a].position.y]) conflicts[arr[a].position.y] = [];
				conflicts[arr[a].position.y].push(arr[a]);
			}
		}
	}
	for (var k in conflicts) {
		var offset = 0, units = [];
		for (b = 0, l2 = conflicts[k].length; b < l2; b++) {
			for (a = 0; a < l; a++) {
				if (arr[a].data.id == conflicts[k][b].data.id && units.indexOf(arr[a].data.id) == -1) {
					units.push(arr[a].data.id);
					if (arr[a].position.x < 0) {
						offset -= 60;
					}
					else {
						offset += 60;
					}
					arr[a].position.x += offset;
				}
			}
		}
	}
	return arr;
}

function createEdges() {
	var _edges = cloneObj(edges), cyEdges = _cy.edges(), cyEdgesLength = cyEdges.length, k, out = [], position,
		offset = 0, offsetTop = 0, classes = '';
	for (var a = 0, l = cyEdgesLength; a < l; a++) {
		k = cyEdges[a].source() + '_' + cyEdges[a].target();
		if (_edges[k]) delete _edges[k];
	}
	for (k in phantoms) {
		// _cy.getElementById(k).position('y', generateOffset + 166);
		_cy.getElementById(k).position('x', generateOffset + 166);
	}
	for (k in phantomsTop) {
		// _cy.getElementById(k).position('y', newOffset - 166);
		_cy.getElementById(k).position('x', newOffset - 166);
	}
	for (k in _edges) {
		if (_edges.hasOwnProperty(k)) {
			classes = '';
			classes += _edges[k].best_parent_unit ? 'best_parent_unit' : '';
			if (_cy.getElementById(_edges[k].data.target).length) {
				out.push({group: "edges", data: _edges[k].data, classes: classes});
			}
			else {
				position = _cy.getElementById(_edges[k].data.source).position();
				// phantoms[_edges[k].data.target] = position.x + offset;
				phantoms[_edges[k].data.target] = position.y + offset;
				out.push({
					group: "nodes",
					data: {id: _edges[k].data.target, unit_s: _edges[k].data.target.substr(0, 7) + '...'},
					//position: {x: position.x + offset, y: generateOffset + 166}
					position: {y: position.y + offset, x: generateOffset + 166}
				});
				offset += 60;
				out.push({group: "edges", data: _edges[k].data, classes: classes});
			}
			if (!_cy.getElementById(_edges[k].data.source).length) {
				position = _cy.getElementById(_edges[k].data.target).position();
				// phantomsTop[_edges[k].data.source] = position.x + offsetTop;
				phantomsTop[_edges[k].data.source] = position.y + offsetTop;
				out.push({
					group: "nodes",
					data: {id: _edges[k].data.source, unit_s: _edges[k].data.source.substr(0, 7) + '...'},
					//position: {x: position.x + offsetTop, y: newOffset - 166}
					position: {y: position.y + offsetTop, x: newOffset - 166}
				});
				offsetTop += 60;
				out.push({group: "edges", data: _edges[k].data, classes: classes});
			}
		}
	}
	return out;
}

function setChangesStableUnits(arrStableUnits) {
	if (!arrStableUnits) return;
	var node;
	arrStableUnits.forEach(function (objUnit) {
		node = _cy.getElementById(objUnit.unit);
		if (node) {
			if (!node.hasClass('is_stable')) node.addClass('is_stable');
			if (objUnit.is_on_main_chain === 1 && !node.hasClass('is_on_main_chain')) {
				node.addClass('is_on_main_chain');
			}
			else if (objUnit.is_on_main_chain === 0 && node.hasClass('is_on_main_chain')) {
				node.removeClass('is_on_main_chain');
			}
		}
		notStable.splice(notStable.indexOf(objUnit.unit), 1);
	});
	updListNotStableUnit();
}

function cloneObj(obj) {
	var out = {};
	for (var k in obj) {
		if (obj.hasOwnProperty(k)) {
			out[k] = obj[k];
		}
	}
	return out;
}

// function highlightNode(unit) {
// 	if (!_cy) createCy();
// 	if (activeNode) _cy.getElementById(activeNode).removeClass('active');
// 	var el = _cy.getElementById(unit);
// 	if (el.length && phantoms[unit] === undefined && phantomsTop[unit] === undefined) {
// 		var extent = _cy.extent();
// 		// var elPositionY = el.position().y;
// 		var elPositionX = el.position().x;
// 		lastActiveUnit = location.hash.substr(1);
// 		el.addClass('active');
// 		activeNode = el.id();
// 		socket.emit('info', {unit: activeNode});
// 		if (elPositionX < extent.x1 || elPositionX > extent.x2) {
// 			bWaitingForPrev = true;
// 			_cy.stop();
// 			_cy.animate({
// 				pan: {y: _cy.pan('y'), x: _cy.getCenterPan(el).x},
// 				complete: function () {
// 					bWaitingForPrev = false;
// 				}
// 			}, {
// 				duration: 250
// 			});
// 		}
// 		page = 'dag';
// 	}
// 	else {
// 		waitGo = unit;
// 		getHighlightNode(waitGo);
// 	}
// 	return false;
// }

function scrollUp() {
	var ext = _cy.extent();
	if ((notLastUnitUp === false && ext.x2 - (ext.w / 2) > _cy.getElementById(nodes[0].data.unit).position().x + 20) ||
		(notLastUnitUp === true && ext.x2 - (ext.w) > _cy.getElementById(nodes[0].data.unit).position().x)
	) {
		_cy.panBy({x: 25, y: 0});
	}
	else if (notLastUnitUp === true) {
		getPrev();
	}
}

function showHideBlock(event, id) {
	var block = $('#' + id);
	var target;
	if (event.target.classList.contains('infoTitle')) {
		target = $(event.target);
	}
	else {
		target = $(event.target.parentNode);
	}
	if (block.css('display') === 'none') {
		block.show(250);
		target.removeClass('hideTitle');
	}
	else {
		block.hide(250);
		target.addClass('hideTitle');
	}
}

function searchForm(text) {
	if (text.length == 44 || text.length == 32) {
		// location.hash = text;
		location.href = './detail#' + text;
	}
	else {
		showInfoMessage("Please enter a unit or address");
	}
	$('#inputSearch').val('');
}

// 回到顶部
function goToTop() {
	if (notLastUnitUp) {
		socket.emit('start', {type: 'last'});
	} else {
		var el = _cy.getElementById(nodes[0].data.unit);
		_cy.stop();
		_cy.animate( {pan: {y: _cy.pan('y'), x: _cy.getCenterPan(el).x}}, {duration: 400} );
	}
	location.hash = '';
	if (activeNode) _cy.getElementById(activeNode).removeClass('active');
	if (!$('#info').hasClass('hideInfoBlock')) $('#info').addClass('hideInfoBlock');
	if ($('#cy').hasClass('showInfoBlock')) $('#cy, #scroll').removeClass('showInfoBlock');

	$('#defaultInfo').show();
	$('#listInfo').hide();
}

// window.addEventListener('hashchange', function () {
// 	if (location.hash.length == 45) {
// 		//highlightNode(location.hash.substr(1));
// 		if ($('#addressInfo').css('display') == 'block') {
// 			$('#addressInfo').hide();
// 		}
// 	}
// 	else if (location.hash.length == 33) {
// 		socket.emit('start', {type: 'address', address: location.hash.substr(1)});
// 	}
// });

window.addEventListener('keydown', function (e) {
	if (page == 'dag') {
		if (e.keyCode == 37) {
			e.preventDefault();
			scrollUp();
		}
		else if (e.keyCode == 39) {
			e.preventDefault();
			_cy.panBy({x: -25, y: 0});
		}
	}
}, true);

$(window).scroll(function () {
	if (($(window).scrollTop() + $(window).height()) + 200 >= $(document).height()) {
		if (!nextPageTransactionsEnd) {
			getNextPageTransactions();
		}
	}
});


// websocket
var socket = io.connect(location.href);
var bWaitingForNext = false, bWaitingForNew = false, bHaveDelayedNewRequests = false, bWaitingForPrev = false,
	bWaitingForHighlightNode = false, bWaitingForNextPageTransactions = false;
var nextPageTransactionsEnd = false, lastInputsROWID = 0, lastOutputsROWID = 0;

socket.on('connect', function () {
	start();
});

socket.on('start', function (data) {
	init(data.nodes, data.edges);
	//console.log('*********************'+JSON.stringify(data.nodes[0]))

	//console.log('---------------'+JSON.stringify(data.nodes[0]))
	// {
	// 	"data": {
	// 		"unit": "InbbVcdQkkCkC6Qapl+g8WNwruinJoSART9o/UrBZN0=",
	// 		"unit_s": "InbbVcd...",
	// 		"round_index": 2
	// 	},
	// 	"rowid": 6796,
	// 	"is_on_main_chain": 1,
	// 	"is_stable": 0,
	// 	"sequence": "good",
	// 	"is_witness_unit": false
	// }
	if (data.not_found) showInfoMessage("Unit not found");
	notLastUnitDown = true;
	if (bWaitingForHighlightNode) bWaitingForHighlightNode = false;
	if (!notLastUnitUp && (location.hash.length != 33)) {
		//highlightNode(data.nodes[0].data.unit);
	}
	socket.emit('staticdata');
});

socket.on('next', function (data) {
	if (notLastUnitDown) {
		if (bWaitingForHighlightNode) bWaitingForHighlightNode = false;
		nodes = nodes.concat(data.nodes);
		for (var k in data.edges) {
			if (data.edges.hasOwnProperty(k)) {
				edges[k] = data.edges[k];
			}
		}
		lastUnit = nodes[nodes.length - 1].rowid;
		generate(data.nodes, data.edges);
		bWaitingForNext = false;
		if (waitGo) {
			//highlightNode(waitGo);
			waitGo = false;
		}
		if (data.nodes.length === 0) {
			notLastUnitDown = false;
		}
		setChangesStableUnits(data.arrStableUnits);
	}
});

socket.on('prev', function (data) {
	if (bWaitingForHighlightNode) bWaitingForHighlightNode = false;
	if (data.nodes.length) {
		nodes = [].concat(data.nodes, nodes);
		for (var k in data.edges) {
			if (data.edges.hasOwnProperty(k)) {
				edges[k] = data.edges[k];
			}
		}
		firstUnit = data.nodes[0].rowid;
		setNew(data.nodes, data.edges);
	}
	bWaitingForPrev = false;
	if (data.end === true) {
		notLastUnitUp = false;
	}
	if (waitGo) {
		//highlightNode(waitGo);
		waitGo = false;
	}
	setChangesStableUnits(data.arrStableUnits);
});


socket.on('update', getNew);

socket.on('new', function (data) {
	if (data.nodes.length) {
		nodes = [].concat(data.nodes, nodes);
		for (var k in data.edges) {
			if (data.edges.hasOwnProperty(k)) {
				edges[k] = data.edges[k];
			}
		}
		firstUnit = nodes[0].rowid;
		setNew(data.nodes, data.edges, true);
		if (bHaveDelayedNewRequests) {
			bHaveDelayedNewRequests = false;
			getNew();
		}
		if (data.nodes.length >= 100) {
			notLastUnitUp = true;
		}
	}
	bWaitingForNew = false;
	setChangesStableUnits(data.arrStableUnits);
});
function getNew() {
	if (notLastUnitUp) return;
	if (!bWaitingForNew) {
		socket.emit('new', {unit: firstUnit, notStable: notStable});
		bWaitingForNew = true;
	}else {
		bHaveDelayedNewRequests = true;
	}
}


socket.on('nextPageTransactions', function (data) {
	if (data) {
		if (data.newLastOutputsROWID && data.newLastOutputsROWID) {
			lastInputsROWID = data.newLastInputsROWID;
			lastOutputsROWID = data.newLastOutputsROWID;
		}
		nextPageTransactionsEnd = data.end;
		//$('#listUnits').append(generateTransactionsList(data.objTransactions, data.address));
		//formatAllNumbers();
	}
	bWaitingForNextPageTransactions = false;
	if (!nextPageTransactionsEnd && $('#tableListTransactions').height() < $(window).height()) getNextPageTransactions();
});

function getNext() {
	if (!bWaitingForNext && isInit) {
		socket.emit('next', {last: lastUnit, notStable: notStable});
		bWaitingForNext = true;
	}
}

function getPrev() {
	if (!bWaitingForPrev && isInit) {
		socket.emit('prev', {first: firstUnit, notStable: notStable});
		bWaitingForPrev = true;
	}
}

// function getHighlightNode(unit) {
// 	if (!bWaitingForHighlightNode) {
// 		socket.emit('highlightNode', {first: firstUnit, last: lastUnit, unit: unit});
// 		bWaitingForHighlightNode = true;
// 	}
// }

function getNextPageTransactions() {
	if (!bWaitingForNextPageTransactions && location.hash.length == 33) {
		socket.emit('nextPageTransactions', {
			address: location.hash.substr(1),
			lastInputsROWID: lastInputsROWID,
			lastOutputsROWID: lastOutputsROWID
		});
		bWaitingForNextPageTransactions = true;
	}
}

//adaptive
function adaptiveShowInfo() {
	$('#cy, #scroll, #goToTop').addClass('showInfoBlock');
	$('#info').removeClass('hideInfoBlock');
}

function closeInfo() {
	$('#info').addClass('hideInfoBlock');
	$('#cy, #scroll, #goToTop').removeClass('showInfoBlock');
}

// function closeAddress() {
// 	$('#addressInfo').hide();
// 	$('#blockListUnspent').hide();
// 	if (!_cy || !lastActiveUnit) {
// 		$('#cy, #scroll, #goToTop').show();
// 		socket.emit('start', {type: 'last'});
// 		location.hash = '';
// 	}
// 	else {
// 		location.hash = lastActiveUnit;
// 	}
// 	page = 'dag';
// }


//infoMessage
var timerInfoMessage;

function showInfoMessage(text, timeMs) {
	if (!timeMs) timeMs = 3000;
	if (timerInfoMessage) clearTimeout(timerInfoMessage);

	$('#infoMessage').html(text).show(350);
	timerInfoMessage = setTimeout(function () {
		$('#infoMessage').hide(350).html('');
	}, timeMs);
}

function hideInfoMessage() {
	if (timerInfoMessage) clearTimeout(timerInfoMessage);
	$('#infoMessage').hide(350).html('');
}


//scroll
var scroll = $('#scroll');
var scrollTopPos = 0, scrollLowPos;

function updateScrollHeigth() {
	var unitTopPos = _cy.getCenterPan(_cy.getElementById(nodes[0].data.unit)).y;
	var unitLowPos = _cy.getCenterPan(_cy.getElementById(nodes[nodes.length - 1].data.unit)).y;
	scrollTopPos = convertPosPanToPosScroll(unitTopPos, 0);
	scrollLowPos = convertPosPanToPosScroll(unitLowPos) + (scroll.height()) + 116;
	$('#scrollBody').height(convertPosPanToPosScroll(unitLowPos - unitTopPos, 0) + (scroll.height() / 2));
	setTimeout(function () {
		scroll.scrollTop(convertPosPanToPosScroll());
	}, 1);
}

scroll.scroll(function (e) {
	e.preventDefault();
	_cy.pan('y', convertPosScrollToPosPan());
});

$(window).resize(function () {
	if (_cy) scroll.scrollTop(convertPosPanToPosScroll());
});

function convertPosScrollToPosPan(posTop) {
	if (!posTop) posTop = scroll.scrollTop();
	return ((scroll.height() / 2) - scrollTopPos) - posTop;
}

function convertPosPanToPosScroll(posY, topPos) {
	if (!posY) posY = _cy.pan('y');
	if (topPos === undefined) topPos = scrollTopPos;
	return ((scroll.height() / 2) - topPos) - posY;
}

//Numbers

function numberFormat(number) {
	return number.replace(new RegExp("^(\\d{" + (number.length % 3 ? number.length % 3 : 0) + "})(\\d{3})", "g"), "$1 $2").replace(/(\d{3})+?/gi, "$1 ").trim().replace(/\s/gi, ",");
}

// function formatAllNumbers() {
// 	var numbersSpan = $('.numberFormat').not('.format');
// 	$.each(numbersSpan, function (a, v) {
// 		$(numbersSpan[a]).addClass('format').html(numberFormat(v.innerHTML));
// 	})
// }

$(document).on('mousedown', '.numberFormat', function (e) {
	var self = $(this);
	if (self.hasClass('format')) {
		self.html(self.html().replace(/\,/g, '')).removeClass('format');
	}
});
$(document).on('touchstart', '.numberFormat', function () {
	var self = $(this);
	if (self.hasClass('format')) {
		self.html(self.html().replace(/\,/g, '')).removeClass('format');
	}
});
$(document).on('mouseout', '.numberFormat', function () {
	var self = $(this);
	if (!self.hasClass('format')) {
		self.addClass('format');
		setTimeout(function () {
			self.html(numberFormat(self.html()));
		}, 250);
	}
});


//escape
function htmlEscape(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

socket.on('staticdata', function (data) {
	$('#allAddress').text(numberFormat(data.allAddress.toString())); // 地址
	$('#allUnits').text(numberFormat(data.allUnits.toString())); // 交易
})

// // 已挖出 x 枚RNG  难度系数
// socket.on('coinbase_mined', function (data) {
// 	// console.log('******',data)
// 	$('.issuedCoin').text(data.issuedCoinbase/1000000); // 已经挖出
// 	$('.nonIssuedCoin').text(500000000 - (data.issuedCoinbase/1000000)); // 还剩下
// 	$('#roundSwitch').text(data.round_index); // 当前轮次
// 	current_round_index = data.round_index;
// 	$('#difficulty').text(data.difficulty); // 难度系数
// })

// 定时器
setInterval(fnGetRoundStatus, 4000);
setInterval(fnGetOnLinePeers, 1000 * 60);
fnGetOnLinePeers();
fnGetRoundStatus();
function fnGetOnLinePeers(){
	socket.emit('getOnLinePeers');
}
function fnGetRoundStatus(){
	socket.emit('getRoundStatus', {round_index: current_round_index});
}

// 在线节点数
socket.on('getOnlinePeers', function (peers) {
	// console.log('peers', peers);
	if(peers.length > 0){
		if($('.peer')){
			$('.peer').remove();
		}
		$('.peernumber').html(peers.length);
		for(var i = 0; i < peers.length; i++){
			$('.peers').append('<li class="peer" >'+ peers[i].peer +'</li>');
		}
	}
});

var curRound;
var addSenconds = 0;
var durationH;
var durationM;

var StraddSenconds;
var StrdurationH;
var StrdurationM;

var couldShow = false;

// transTimeStamp
socket.on('transTimeStamp', function (time) {
	if(time == -1){
		$('#durationHour').text('error');
		return false;
	}

	couldShow = true;
	var durationT = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 - time; // 时间差 (处理时区问题)
	durationH = new Date(durationT).getHours();
	durationM = new Date(durationT).getMinutes();
	addSenconds = new Date(durationT).getSeconds();
	if(durationH.toString().length == 1){
		StrdurationH = '0' + durationH.toString();
	}else {
		StrdurationH = durationH.toString();
	}

	if(durationM.toString().length == 1){
		StrdurationM = '0' + durationM.toString();
	}else {
		StrdurationM = durationM.toString();
	}

	if(addSenconds.toString().length == 1){
		StraddSenconds = '0' + addSenconds.toString();
	}else {
		StraddSenconds = addSenconds.toString();
	}
	$('#durationHour').text(StrdurationH);
	$('#durationMin').text(StrdurationM);
	$('#durationSenc').text(StraddSenconds);
})
// 定时器 1s
setInterval(function(){
	if(!couldShow){return false;}
	addSenconds++;
	if(addSenconds == 60){
		addSenconds = 0;
		durationM++;
		if(durationM == 60){
			durationM = 0;
			durationH++;
			if(durationH.toString().length == 1){
				StrdurationH = '0' + durationH.toString();
			}else {
				StrdurationH = durationH.toString();
			}
			$('#durationHour').text(StrdurationH);
		}
		if(durationM.toString().length == 1){
			StrdurationM = '0' + durationM.toString();
		}else {
			StrdurationM = durationM.toString();
		}
		$('#durationMin').text(StrdurationM);
	}
	if(addSenconds.toString().length == 1){
		StraddSenconds = '0' + addSenconds.toString();
	}else {
		StraddSenconds = addSenconds.toString();
	}
	$('#durationSenc').text(StraddSenconds);
}, 1000);

// 每一轮 详细状态
socket.on('getRoundStatus', function (roundStatus) {

	// 切换轮次时候 发送
	if(curRound !== roundStatus.roundIndex){
		curRound = roundStatus.roundIndex;
		socket.emit('getDurationTime', {curRound: curRound - 1});
		// console.log(curRound - 1);
	}
	
	// console.log('--- 每一轮 status: ---', roundStatus);
	$('#numTrustme').text(roundStatus.countofTrustMEUnit);
	$('#numCoinbase').text(roundStatus.countofCoinbaseUnit);
	if(roundStatus.countofPOWUnit > 10){
		$('#numPow').text(10);
	} else{
		$('#numPow').text(roundStatus.countofPOWUnit);
	}
	$('.depositRatio').text(roundStatus.depositRatio);
	$('.inflationRatio').text(roundStatus.inflationRatio.toFixed(2));
	$('.issuedCoin').text(roundStatus.totalMine.toString().substr(0,roundStatus.totalMine.toString().length - 6));
	$('.nonIssuedCoin').text(roundStatus.totalPublishCoin.toString().substr(0, roundStatus.totalPublishCoin.toString().length - 6));
	$('#difficulty').text(roundStatus.difficultyOfRound);
	$('#roundSwitch').text(roundStatus.roundIndex);
	$('.personBox').css('background','#E9EFF7');
	$('.personBoxImg').attr('src','img/personB.png');
	for(var i = 0; i < roundStatus.countofPOWUnit; i++){
		$('.personBox').eq(i).css('background','#3192F2');
		$('.personBoxImg').eq(i).attr('src','img/personW.png');
		// $('.personBoxImg').eq(i).attr('title','我的地址：12345');
	}
	if(roundStatus.arrPowUnits){
		$('.personBox').attr('title','');
		for(var i = 0; i < roundStatus.arrPowUnits.length; i++){
			$('.personBox').eq(i).attr('title', roundStatus.arrPowUnits[i].address);
		}
	}
})

