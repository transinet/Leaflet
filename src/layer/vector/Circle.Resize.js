/*
 * L.Handler.CircleDrag is used internally by L.Circle to make the circles draggable.
 */

L.Handler.CircleResize = L.Handler.extend({
    options: {
        icon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon'
        })
    },

    initialize: function (circle, options) {
        this._circle = circle;
        L.Util.setOptions(this, options);
    },

    addHooks: function () {
        if (this._circle._map) {

            // display handler
            this._markerGroup = new L.LayerGroup();
            this._circle._map.addLayer(this._markerGroup);
            this._initHandler();
        }
    },

    removeHooks: function () {
        if (this._circle._map) {
            this._circle.off('drag', this._updateHandler, this);
            this._circle._map.removeLayer(this._markerGroup);
            delete this._markerGroup;
            delete this._origins;
        }
    },

    _initHandler: function () {
        // define handler (icon and position)
        var icon = this.options.icon,
            bounds = this._circle.getBounds(),
            handlerll = new L.LatLng(this._circle.getLatLng().lat, bounds.getNorthEast().lng);

        this._dragHandler = new L.Marker(handlerll, {
                icon: icon,
                draggable: true
            });

        // define handler events
        this._dragHandler
            .on('dragstart', this._onDragStart, this)
            .on('drag', this._onDrag, this)
            .on('dragend', this._onDragEnd, this);

        this._circle.on('drag', this._updateHandler, this);
        this._circle._map.on('zoomend', this._setOrigins, this);
        this._markerGroup.addLayer(this._dragHandler);
        this._setOrigins();
    },

    _updateHandler: function (e) {
        var originc = this._origins.circle,
            originh = this._origins.handler,
            newc = this._circle._map.project(this._circle.getLatLng()),

            delta = {
                x: originh.x - originc.x,
                y: originh.y - originc.y
            },
            distanceInPxRatio = this._origins.cos / Math.cos(this._circle.getLatLng().lat * L.LatLng.DEG_TO_RAD);

        delta.x = delta.x * distanceInPxRatio;
        delta.y = delta.y * distanceInPxRatio;

        var newXY = {
            x: newc.x + delta.x,
            y: newc.y + delta.y
        };

        var hpoint = new L.Point(newXY.x, newXY.y);
        this._dragHandler.setLatLng(this._circle._map.unproject(hpoint));
    },

    _onDragStart: function (e) {
    },

    _onDrag: function (e) {
        var circleCenter = this._circle.getLatLng(),
            centerPos = this._circle._map.project(circleCenter),
            handlerXY = this._circle._map.project(e.target.getLatLng()),
            handlerPos = {
                x: handlerXY.x,
                y: handlerXY.y
            },
            radiusInPix = Math.sqrt(Math.pow(centerPos.x - handlerPos.x, 2) + Math.pow(centerPos.y - handlerPos.y, 2)),
            point = new L.Point(centerPos.x + radiusInPix, centerPos.y);

        this._circle.setRadius(circleCenter.distanceTo(this._circle._map.unproject(point)));
        this._circle.fire('resize');
    },

    _onDragEnd: function () {
        this._setOrigins();
    },

    _setOrigins: function () {
        // memorize circle and handler origins
        if (typeof(this._circle._map) !== 'undefined' && this._circle._map instanceof L.Map) {
            var map = this._circle._map;
            this._origins = {
                cos:  Math.cos(this._circle.getLatLng().lat * L.LatLng.DEG_TO_RAD),
                circle: map.project(this._circle.getLatLng()),
                handler: map.project(this._dragHandler.getLatLng())
            };
        }
    }

});
