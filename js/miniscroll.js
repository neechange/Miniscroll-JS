/**
 * Miniscroll small plugin of scrollbar desktop and mobile
 *
 * @author Roger Luiz <http://rogerluizm.com.br/>
 *					  <http://miniscroll.rogerluizm.com.br>
 *
 * @copyright (c) 2011, 2012 <http://rogerluizm.com.br/>
 * @package Loo UI
 *
 * @version 0.2
 */
(function(window, document) {
	/**
	 * Contructor
	 *
	 * @param {Element} target Main element of the scroll
	 * @param {Object} args parameters for config the scroll (args.size, args.handle, args.scrubColor, args.trackerColor, args.axis)
	 */
	function Miniscroll(target, args) {
		// global variable
		var self = this;
		
		// scroll components and arguments
		/** @type {Element} */
		this.target = document.getElementById(target);
		/** @type {Object} */
		this.args = args || {};
		/** @type {Element} */
		this.scrub = null;
		/** @type {Element} */
		this.tracker = null;
		/** @type {Element} */
		this.scrollbar = null;
		
		// Define the props the scroll
		this.setDefaultArgs();
		
		// Create the components
		this.createScrollbar();
		
		// Drag variables
		/** @type {bolean} */
		this.dragging = false;
		/** @type {number} */
		this.x = 0;
		/** @type {number} */
		this.y = 0;
		/** @type {number} */
		this.ty = 0;
		/** @type {number} */
		this.tx = 0;
		/** @type {Object|number} */
		this.ratio = {
			x:(this.target.scrollWidth - this.target.offsetWidth) / (this.tracker.offsetWidth - this.scrub.offsetWidth),
			y:(this.target.scrollHeight - this.target.offsetHeight) / (this.tracker.offsetHeight - this.scrub.offsetHeight)
		};
		/** @type {Object|number} */
		this.point = null;
		
		// Update variables
		/** @type {Object} */
		this.scrollTime = null;
		/** @type {number} */
		this.scrollHeight = this.target.scrollHeight;
		
		// Added event listener
		if(this.isTouchDevice()) {
			// mobile event listener
			this.addEvent(this.target, 'touchstart', function(event) {
				self.onTouchStart(event);
			});
		} else {
			// desktop event listener
			this.addEvent(this.scrub, "mousedown", function(event) { 
				self.stopEvent(event);
				self.onStartDrag(event);
			});
			
			this.addEvent(this.tracker, "mousedown", function(event){ 
				self.stopEvent(event);
				self.onTrackerMove(event);
			});
			
			this.addEvent(this.target, "mousewheel", function(event) {
				self.stopEvent(event);
				self.onWheelDrag(event);
			});
		}
		
		// Start the update scroll
		this.scrollTime = window.setInterval(function() {
			self.onUpdate();
		}, 60);
	}
	
	/**
	 * Create scrollbar components (scrollbar contaner, tracker and scrub)
	 * and added to document
	 *
	 * @this {Miniscroll}
	 * @return {Void}
	 */
	Miniscroll.prototype.createScrollbar = function() {
		// Create and added scrollbar container
		var scrollbar = document.createElement('div');
			scrollbar.setAttribute('id', this.target.id + '_scroll');
			scrollbar.setAttribute('class', "miniscrollContainer");
			if(this.args.axis === "y") {
				scrollbar.style.top = this.target.offsetTop + "px";
				scrollbar.style.left = ((this.target.offsetLeft + this.target.offsetWidth) - this.args.size) + "px";
				scrollbar.style.width = this.args.size + "px";
				scrollbar.style.height = this.target.offsetHeight + "px";
			} else {
				scrollbar.style.top = ((this.target.offsetTop + this.target.offsetHeight) - this.args.size) + "px";
				scrollbar.style.left = this.target.offsetLeft + "px";
				scrollbar.style.width = this.target.offsetWidth + "px";
				scrollbar.style.height = this.args.size + "px";
			}
			scrollbar.style.position = 'absolute';
			scrollbar.style.zIndex = '9999';
			
		this.target.appendChild(scrollbar);
		this.scrollbar = document.getElementById(this.target.id + '_scroll');
		
		
		// Create and added tracker
		var tracker = document.createElement('div');
			tracker.setAttribute('id', this.target.id + '_tracker');
			if(this.args.axis === "y") {
				tracker.style.width = this.args.size + "px";
				tracker.style.height = this.target.offsetHeight + "px";
			} else {
				tracker.style.width = this.target.offsetWidth + "px";
				tracker.style.height = this.args.size + "px";
			}
			if(this.args.trackerColor !== undefined) tracker.style.backgroundColor = this.args.trackerColor;
			tracker.style.position = 'absolute';
		
		scrollbar.appendChild(tracker);
		this.tracker = document.getElementById(this.target.id + '_tracker');
		
		
		var h = (this.target.offsetHeight * tracker.offsetHeight) / this.target.scrollHeight;
		var w = (this.target.offsetWidth * tracker.offsetWidth) / this.target.scrollWidth;
		
		// Create and added scrub
		var scrub = document.createElement('div');
			scrub.setAttribute('id', this.target.id + '_scrub');
			if(this.args.axis === "y") {
				scrub.style.width = this.args.size + "px";
				if(this.args.handle === undefined || this.args.handle === 'auto') {
					scrub.style.height = h + "px";
				} else {
					scrub.style.height = this.args.handle + "px";
				}
				
			} else {
				if(this.args.handle === undefined || this.args.handle === 'auto') {
					scrub.style.width = w + "px";
				} else {
					scrub.style.width = this.args.handle + "px";
				}
				scrub.style.height = this.args.size + "px";
			}
			if(this.args.scrubColor !== undefined) scrub.style.backgroundColor = this.args.scrubColor;
			scrub.style.position = 'absolute';
		
		scrollbar.appendChild(scrub);
		
		this.scrub = document.getElementById(this.target.id + '_scrub');
	};
	
	Miniscroll.prototype.setDefaultArgs = function() {
		if(this.args.axis === undefined) this.args.axis = "y";
		if(this.args.size === undefined) this.args.size = 12;
		if(this.args.handle === undefined) this.args.handle = 'auto';
		if(this.args.scrubColor === undefined) this.args.scrubColor = "#000000";
		if(this.args.trackerColor === undefined) this.args.trackerColor = "#ffffff";
	};
	
	/**
	 * Update the scroll position and the size of scrub
	 *
	 * @this {Miniscroll}
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.onUpdate = function() {
		var h = (this.target.offsetHeight * this.tracker.offsetHeight) / this.target.scrollHeight;
		var w = (this.target.offsetWidth * this.tracker.offsetWidth) / this.target.scrollWidth;
		
		this.ratio = {
			x:(this.target.scrollWidth - this.target.offsetWidth) / (this.tracker.offsetWidth - this.scrub.offsetWidth),
			y:(this.target.scrollHeight - this.target.offsetHeight) / (this.tracker.offsetHeight - this.scrub.offsetHeight)
		};
		
		if(this.args.axis === "y") {
			if(this.args.handle === undefined || this.args.handle === 'auto') {
				this.scrub.style.height = h + "px";
			}
			
			if(this.tracker.offsetHeight >= this.target.scrollHeight) {
				this.scrollbar.style.visibility = "hidden";
			} else {
				this.scrollbar.style.visibility = "visible";
			}
			
			
			if(this.target.scrollHeight > this.scrollHeight) {
				var pct = (-this.target.scrollTop / (-this.target.scrollHeight + this.target.offsetHeight));
				this.scroll(0, pct * (this.tracker.offsetHeight - this.scrub.offsetHeight));
			}
			
		} else {
			if(this.args.handle === undefined || this.args.handle === 'auto') {
				this.scrub.style.width = w + "px";
			}
			
			if(this.tracker.offsetWidth >= this.target.scrollWidth) {
				this.scrollbar.style.visibility = "hidden";
			} else {
				this.scrollbar.style.visibility = "visible";
			}
			
			if(this.target.scrollWidth > this.scrollWidth) {
				var pct = (-this.target.scrollLeft / (-this.target.scrollWidth + this.target.offsetHeight));
				this.scroll(pct * (this.tracker.offsetWidth - this.scrub.offsetWidth), 0);
			}
		}
	};
	
	/**
	 * Start the touch position
	 *
	 * @this {Miniscroll}
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.onTouchStart = function(e) {
		var that = this;
		this.ty = e.targetTouches[0].pageY;
		this.tx = e.targetTouches[0].pageX;
		
		this.addEvent(this.target, 'touchmove', function(e) {
			that.onTouchMove(event);
		});
	};
	
	/**
	 * Scroll the content and scrub
	 *
	 * @this {Miniscroll}
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.onTouchMove = function(e) {
		e.preventDefault();
		var posy = e.targetTouches[0].pageY;
		var posx = e.targetTouches[0].pageX;
		
		this.scroll((this.args.axis === "x") ? this.scrub.offsetLeft - (posx - this.tx) : 0, (this.args.axis === "y") ? this.scrub.offsetTop - (posy - this.ty) : 0);
		
		if(this.args.axis === "y") this.ty = posy;
		if(this.args.axis === "x") this.tx = posx;
	};
	
	
	/**
	 * Start the mouse position
	 *
	 * @this {Miniscroll}
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.onStartDrag = function(e) {
		var e = window.event || e;
		var self = this;
		this.dragging = true;
		this.point = {
			x:(e.clientX + document.body.scrollLeft) - this.findOffsetLeft(this.scrub),
			y:(e.clientY + document.body.scrollTop) - this.findOffsetTop(this.scrub),
			offsetX:this.findOffsetLeft(this.tracker),
			offsetY:this.findOffsetTop(this.tracker)
		};
		
		this.addEvent(document, "mousemove", function(e) {
			self.stopEvent(e);
			self.onMoveDrag(e);
		});
		this.addEvent(document, "mouseup", function(e) {
			self.stopEvent(e);
			self.onStopDrag(e);
		});
	};
	
	/**
	 * Scroll the content and scrub
	 *
	 * @this {Miniscroll}
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.onMoveDrag = function(e) {
		var e = window.event || e;
		var dist = { 
			x:(e.clientX + document.body.scrollLeft) - this.point.offsetX,
			y:(e.clientY + document.body.scrollTop) - this.point.offsetY
		};
		var offset = { x:dist.x - this.point.x, y:dist.y - this.point.y };
		
		if(this.dragging) {
			this.scroll(offset.x, offset.y);
		}
		//
		this.stopEvent(e);
	};
	
	/**
	 * Scroll the scrub at the position the click
	 *
	 * @this {Miniscroll}
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.onTrackerMove = function(e) {
		var e = window.event || e;
		var pos = {
			x: e.clientX + document.body.scrollLeft,
			y: e.clientY + document.body.scrollTop
		};
		var offset = {
			x: pos.x - this.findOffsetLeft(this.tracker) - this.scrub.offsetWidth/2,
			y: pos.y - this.findOffsetTop(this.tracker) - this.scrub.offsetHeight/2
		};
		
		this.scroll(offset.x, offset.y);
	};
	
	/**
	 * Mouse wheel the scrollbar
	 *
	 * @this {Miniscroll}
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.onWheelDrag = function(e) {
		// Old IE support
		var e = window.event || e;
		
		// Solution by Craig Buckler 
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		
		this.scroll(this.x + (-delta * 20), this.y + (-delta * 20));
	};
	
	/**
	 * Stop the event listeners
	 *
	 * @this {Miniscroll}
	 */
	Miniscroll.prototype.onStopDrag = function(e) {
		this.dragging = false;
		this.removeEvent(document, "mousemove", function(e) {});
		this.removeEvent(document, "mouseup", function(e) {});
	};
	
	/**
	 * Move scrub and content
	 *
	 * @this {Miniscroll}
	 * @param {numebr} x Moving the scrub to the position x
	 * @param {numebr} y Moving the scrub to the position y
	 */
	Miniscroll.prototype.scroll = function(x, y) {
		if(this.args.axis === "y") {
			if(y > this.tracker.offsetHeight - this.scrub.offsetHeight) {
				y = this.tracker.offsetHeight - this.scrub.offsetHeight;
			}
			
			if(y < 0) {
				y = 0;
			}
			
			this.scrub.style.top = y + "px";
			this.y = y;
			
		} else {
			if(x > this.tracker.offsetWidth - this.scrub.offsetWidth) {
				x = this.tracker.offsetWidth - this.scrub.offsetWidth;
			}
			
			if(x < 0) {
				x = 0;
			}
				
			this.scrub.style.left = x + "px";
			this.x = x;
		}
		
		this.contentTo();
	};
	
	/**
	 * Move to the scrollbar and content 
	 *
	 * @this {Miniscroll}
	 * @param {numebr} x Moving the scrub to the position x
	 * @param {numebr} y Moving the scrub to the position y
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.scrollTo = function(x, y) {
		this.scroll( (x / this.ratio.x), (y / this.ratio.y) );
	};
	
	/**
	 * Move the content target
	 *
	 * @this {Miniscroll}
	 * @see {Function} scroll()
	 */
	Miniscroll.prototype.contentTo = function() {
		if(this.args.axis === "y") {
			this.target.scrollTop = Math.round(this.y * this.ratio.y);
		} else {
			this.target.scrollLeft = Math.round(this.x * this.ratio.x);
		}
	};
	
	/**
	 * Find the offset top of the element
	 *
	 * @this {Miniscroll}
	 * @param {Element} element Target to return the position top
	 * @return {number} Return the offset top
	 * @author Quirksmode
	 */
	Miniscroll.prototype.findOffsetTop  = function(element) {
		var offset = 0;
		if (element.offsetParent) {
			while (element.offsetParent) {
				offset += element.offsetTop;
				element  = element.offsetParent;
			}
		}
		return offset;
	};
	
	/**
	 * Find the offset left of the element
	 *
	 * @this {Miniscroll}
	 * @param {Element} element Target to return the position left
	 * @return {number} Return the offset left
	 * @author Quirksmode
	 */
	Miniscroll.prototype.findOffsetLeft  = function(element) {
		var offset = 0;
		if (element.offsetParent) {
			while (element.offsetParent) {
				offset += element.offsetLeft;
				element  = element.offsetParent;
			}
		}
		return offset;
	};
	
	/**
	* Added event for all browsers
	*
	* @this {Miniscroll}
	* @type {Element} element Element to be used for the event
	* @type {string} eventType Mouse event to be used
	* @type {Function} callBack Function that contains the codes
	*/
	Miniscroll.prototype.addEvent = function(element, eventType, callBack) {
		if(element.addEventListener) {
			if(eventType === "mousewheel") {
				var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
				element.addEventListener(mousewheelevt, callBack, false);
			} else {
				element.addEventListener(eventType, callBack, false);
			}
			this.addEvent = function (element, eventType, callBack) {
				element.addEventListener(eventType, callBack, false);
			};
			
		} else if (element.attachEvent) {
			element.attachEvent("on" + eventType, callBack);
			this.addEvent = function (element, eventType, callBack) {
				element.attachEvent("on" + eventType, callBack);
			};
		} else {
			element['on' + eventType] = callBack;
			this.addEvent = function (element, eventType, callBack) {
				element['on' + eventType] = callBack;
			};
		}
	};
	
	/**
	* Remove event for all browsers
	*
	* @this {Miniscroll}
	* @type {Element} element Element to be used for the event
	* @type {string} eventType Mouse event to be used
	* @type {Function} callBack Function that contains the codes
	*/
	Miniscroll.prototype.removeEvent = function(element, eventType, callBack){
		if(element.addEventListener) {
			if(eventType === "mousewheel") {
				var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
				element.addEventListener(mousewheelevt, callBack, false);
			} else {
				element.removeEventListener(eventType, callBack, false);
			}
			
			this.removeEvent = function (element, eventType, callBack) {
				element.removeEventListener(eventType, callBack, false);
			};
		} else if (element.attachEvent) {
			element.detachEvent("on" + eventType, callBack);
			this.removeEvent = function (element, eventType, callBack) {
				element.detachEvent("on" + eventType, callBack);
			};
		} else {
			element['on' + eventType] = null;
			this.removeEvent = function (element, eventType, callBack) {
				element['on' + eventType] = null;
			};
		}
	};
	
	/**
	 * Stop the propagation event
	 *
	 * @this {Miniscroll}
	 */
	Miniscroll.prototype.stopEvent = function(event) {
		if (event.stopPropagation) {
			event.stopPropagation();
		} else {
			event.cancelBubble = true;
		}

		if (event.preventDefault) {
			event.preventDefault();
		} else {
			event.returnValue = false;
		}
	};
	
	/**
	 * Check if the device has the touch event, return true or false
	 *
	 * @this {Miniscroll}
	 * @return {Boolean} Return true if is mobile else false if is desktop
	 */
	Miniscroll.prototype.isTouchDevice = function() {
		return "ontouchstart" in window;
	};
	
	window.Miniscroll = Miniscroll;
	
})(window, document);