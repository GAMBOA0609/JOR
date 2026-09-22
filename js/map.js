// Configurar Proj4 para UTM Zona 17 Sur (EPSG:32717)
if (typeof proj4 !== 'undefined') {
    proj4.defs("EPSG:32717", "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs");
    ol.proj.proj4.register(proj4);
}

document.addEventListener("DOMContentLoaded", () => {

    // --- 1. Base Maps Configuration ---
    const osmBase = new ol.layer.Tile({
        title: 'osm',
        type: 'base',
        visible: false,
        source: new ol.source.OSM()
    });

    const satelliteLayer = new ol.layer.Tile({
        title: 'satellite',
        type: 'base',
        visible: true,
        source: new ol.source.XYZ({
            url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            attributions: '&copy; Google Satellite Imagery'
        })
    });

    // --- 2. GeoServer WMS Layers ---
    // Make sure GeoServer is running on your local Tomcat with CORS enabled if this is served from a different port
    const wmsSource = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/portal_jor/wms',
        params: {
            'LAYERS': 'portal_jor:pg_predios',
            'VERSION': '1.1.0',
            'FORMAT': 'image/png',
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    });

    const prediosLayer = new ol.layer.Image({
        title: 'predios',
        source: wmsSource,
        opacity: 0.9,
        visible: true
    });

    // --- 2.1 Nueva Capa: pg_poligono ---
    const wmsSourcePoligono = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/portal_jor/wms',
        params: {
            'LAYERS': 'portal_jor:pg_poligono',
            'VERSION': '1.1.0',
            'FORMAT': 'image/png',
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    });

    const poligonoLayer = new ol.layer.Image({
        title: 'poligono',
        source: wmsSourcePoligono,
        opacity: 0.8,
        visible: true
    });

    // --- 2.2 Nueva Capa: pg_linea ---
    const wmsSourceLinea = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/portal_jor/wms',
        params: {
            'LAYERS': 'portal_jor:pg_linea',
            'VERSION': '1.1.0',
            'FORMAT': 'image/png',
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    });

    const lineaLayer = new ol.layer.Image({
        title: 'linea',
        source: wmsSourceLinea,
        opacity: 0.9,
        visible: true
    });

    // --- 2.3 Nueva Capa: pg_punto ---
    const wmsSourcePunto = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/portal_jor/wms',
        params: {
            'LAYERS': 'portal_jor:pg_punto',
            'VERSION': '1.1.0',
            'FORMAT': 'image/png',
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    });

    // Diagnóstico: Registrar errores de carga en la capa de puntos
    wmsSourcePunto.on('imageloaderror', function () {
        console.error('ERROR DE CARGA: La capa de puntos (pg_punto) no pudo cargarse. Revisa la URL en la pestaña Network.');
    });

    const puntoLayer = new ol.layer.Image({
        title: 'punto',
        source: wmsSourcePunto,
        opacity: 1.0,
        visible: true
    });

    // --- 2.4 Nueva Capa: pg_poligonos_liberacion ---
    const wmsSourceLiberacion = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/portal_jor/wms',
        params: {
            'LAYERS': 'portal_jor:pg_poligonos_liberacion',
            'VERSION': '1.1.0',
            'FORMAT': 'image/png',
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    });

    const liberacionLayer = new ol.layer.Image({
        title: 'liberacion',
        source: wmsSourceLiberacion,
        opacity: 0.8,
        visible: true
    });

    // --- 2.5 Nueva Capa: pg_lim_departamentos ---
    const wmsSourceLimDepartamentos = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/portal_jor/wms',
        params: {
            'LAYERS': 'portal_jor:pg_lim_departamentos',
            'VERSION': '1.1.0',
            'FORMAT': 'image/png',
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    });

    const limDepartamentosLayer = new ol.layer.Image({
        title: 'limDepartamentos',
        source: wmsSourceLimDepartamentos,
        opacity: 0.8,
        visible: true
    });

    // --- 2.6 Nueva Capa: pg_lim_provincial ---
    const wmsSourceLimProvincial = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/portal_jor/wms',
        params: {
            'LAYERS': 'portal_jor:pg_lim_provincial',
            'VERSION': '1.1.0',
            'FORMAT': 'image/png',
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    });

    const limProvincialLayer = new ol.layer.Image({
        title: 'limProvincial',
        source: wmsSourceLimProvincial,
        opacity: 0.8,
        visible: true
    });

    // --- 2.7 Nueva Capa: pg_lim_distrital ---
    const wmsSourceLimDistrital = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/portal_jor/wms',
        params: {
            'LAYERS': 'portal_jor:pg_lim_distrital',
            'VERSION': '1.1.0',
            'FORMAT': 'image/png',
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    });

    const limDistritalLayer = new ol.layer.Image({
        title: 'limDistrital',
        source: wmsSourceLimDistrital,
        opacity: 0.8,
        visible: true
    });

    // Vector Layer to hold Selection Highlight
    const highlightSource = new ol.source.Vector();
    const highlightLayer = new ol.layer.Vector({
        source: highlightSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#00ffff', // Cyan Neón para alta visibilidad
                width: 4
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 255, 255, 0.2)'
            }),
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: 'rgba(0, 255, 255, 0.4)' }),
                stroke: new ol.style.Stroke({ color: '#00ffff', width: 2 })
            })
        }),
        zIndex: 100
    });


    // --- 3. View and Map Initialization ---
    // Start at the project's bounding box center
    const view = new ol.View({
        center: ol.proj.fromLonLat([-79.71995, -6.45399]), // Centro calculado del Bbox proporcionado
        zoom: 13, // Zoom ajustado para ver toda la extensión
        maxZoom: 20
    });

    const map = new ol.Map({
        target: 'map',
        layers: [osmBase, satelliteLayer, limDepartamentosLayer, limProvincialLayer, limDistritalLayer, liberacionLayer, prediosLayer, poligonoLayer, lineaLayer, puntoLayer, highlightLayer],
        view: view,
        controls: ol.control.defaults.defaults({
            zoom: false,
            attributionOptions: { collapsible: true }
        }).extend([
            new ol.control.ScaleLine({
                units: 'metric',
                bar: true,
                steps: 4,
                text: true,
                minWidth: 100
            })
        ])
    });

    // Expose map to global for UI resizing
    window.map = map;

    // --- 4. Controls & Interactions ---

    // Basemap Switcher
    const basemapSelect = document.getElementById('basemap-select');
    basemapSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        osmBase.setVisible(val === 'osm');
        satelliteLayer.setVisible(val === 'satellite');
    });

    // Layer Toggle (Predios)
    const layerPrediosCheck = document.getElementById('layer-predios');
    layerPrediosCheck.addEventListener('change', (e) => {
        prediosLayer.setVisible(e.target.checked);
    });

    // Layer Toggle (Poligono)
    const layerPoligonoCheck = document.getElementById('layer-poligono');
    layerPoligonoCheck.addEventListener('change', (e) => {
        poligonoLayer.setVisible(e.target.checked);
    });

    // Layer Toggle (Linea)
    const layerLineaCheck = document.getElementById('layer-linea');
    layerLineaCheck.addEventListener('change', (e) => {
        lineaLayer.setVisible(e.target.checked);
    });

    // Layer Toggle (Punto)
    const layerPuntoCheck = document.getElementById('layer-punto');
    layerPuntoCheck.addEventListener('change', (e) => {
        puntoLayer.setVisible(e.target.checked);
    });

    // Layer Toggle (Liberacion)
    const layerLiberacionCheck = document.getElementById('layer-liberacion');
    layerLiberacionCheck.addEventListener('change', (e) => {
        liberacionLayer.setVisible(e.target.checked);
    });

    // Layer Toggle (Lim Departamental)
    const layerLimDepartamentalCheck = document.getElementById('layer-lim-departamental');
    layerLimDepartamentalCheck.addEventListener('change', (e) => {
        limDepartamentosLayer.setVisible(e.target.checked);
    });

    // Layer Toggle (Lim Provincial)
    const layerLimProvincialCheck = document.getElementById('layer-lim-provincial');
    layerLimProvincialCheck.addEventListener('change', (e) => {
        limProvincialLayer.setVisible(e.target.checked);
    });

    // Layer Toggle (Lim Distrital)
    const layerLimDistritalCheck = document.getElementById('layer-lim-distrital');
    layerLimDistritalCheck.addEventListener('change', (e) => {
        limDistritalLayer.setVisible(e.target.checked);
    });

    // --- 5. GetFeatureInfo (WMS Click Interrogation multi-layer) ---
    const fetchInventorySummary = async (predioFeature, predioCode) => {
        const geomOriginal = predioFeature.getGeometry();
        if (!geomOriginal) return;

        // Clonar y transformar la geometría a UTM 17S (EPSG:32717)
        const geomUTM = geomOriginal.clone().transform('EPSG:3857', 'EPSG:32717');

        const wktFormat = new ol.format.WKT();
        const wkt = wktFormat.writeGeometry(geomUTM);

        const layers = [
            { name: 'portal_jor:pg_poligono', type: 'POLIGONO' },
            { name: 'portal_jor:pg_linea', type: 'LINEA' },
            { name: 'portal_jor:pg_punto', type: 'PUNTO' }
        ];

        const allResults = {};

        for (const layer of layers) {
            // Se especifica el SRS nativo en la consulta CQL para máxima precisión
            const url = 'http://localhost:8080/geoserver/portal_jor/wfs?' +
                'service=WFS&version=1.1.0&request=GetFeature&' +
                'typeName=' + layer.name + '&outputFormat=application/json&' +
                'srsName=EPSG:32717&' +
                'cql_filter=' + encodeURIComponent(`INTERSECTS(geom, ${wkt})`);

            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.features) {
                    data.features.forEach(f => {
                        const props = f.properties || {};
                        const val = String(props.tipo || props.Tipo || "");
                        if (val) {
                            let label = val;
                            let count = 1;

                            if (layer.type === 'POLIGONO') {
                                const dict = {
                                    "1": "EDIFICACIÓN",
                                    "2": "OBRAS COMPLEMENTARIAS",
                                    "3": "PLANTACIONES PERMANENTES",
                                    "4": "PLANTACIONES FORESTALES",
                                    "5": "PLANTACIONES TRANSITORIAS"
                                };
                                label = dict[val] || val;
                            } else {
                                const dict = {
                                    "1": "PLANTACIONES PERMANENTES",
                                    "2": "PLANTACIONES FORESTALES",
                                    "3": "CERCO VIVO",
                                    "4": "INFRAESTRUCTURA EXISTENTE",
                                    "5": "OBRAS COMPLEMENTARIAS"
                                };
                                label = dict[val] || val;

                                // Lógica de conteo específica
                                if (layer.type === 'PUNTO') {
                                    // Excepto Obras Complementarias (tipo 5), sumar num_plantas
                                    if (val !== "5") {
                                        count = parseInt(props.num_plantas || props.Num_Plantas || 1, 10);
                                    }
                                }
                            }

                            const upperLabel = label.toUpperCase();
                            allResults[upperLabel] = (allResults[upperLabel] || 0) + count;
                        }
                    });
                }
            } catch (e) {
                console.warn(`Error consultando inventario para ${layer.name}:`, e);
            }
        }

        if (window.renderInventorySummary) {
            window.renderInventorySummary(allResults, predioCode);
        }
    };

    map.on('singleclick', async (evt) => {
        // [NUEVO] Si la herramienta de medición está activa, no realizar selección
        if (draw) return;

        const coordinate = evt.coordinate;
        const viewResolution = view.getResolution();

        // Establecer cursor en espera
        document.getElementById('map').style.cursor = 'wait';

        // Limpiar selección previa
        highlightSource.clear();
        if (window.hideFeatureInfo) window.hideFeatureInfo();
        if (window.clearInventorySummary) window.clearInventorySummary();

        // 1. Determinar capas activas operativas para consultar
        const activeLayers = [];
        if (prediosLayer.getVisible()) activeLayers.push('portal_jor:pg_predios');
        if (poligonoLayer.getVisible()) activeLayers.push('portal_jor:pg_poligono');
        if (lineaLayer.getVisible()) activeLayers.push('portal_jor:pg_linea');
        if (puntoLayer.getVisible()) activeLayers.push('portal_jor:pg_punto');
        if (liberacionLayer.getVisible()) activeLayers.push('portal_jor:pg_poligonos_liberacion');

        if (activeLayers.length === 0) {
            document.getElementById('map').style.cursor = 'default';
            return;
        }

        // 2. Transformar punto de clic a UTM 17S (EPSG:32717) para consulta de alta definición
        const coordUTM = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:32717');
        const easting = coordUTM[0];
        const northing = coordUTM[1];

        // 3. Construir CQL_FILTER Quirúrgico:
        // - INTERSECTS: Solo captura el polígono que contiene el punto.
        // - DWITHIN: Captura líneas/puntos en un radio milimétrico (20cm).
        const pointStr = `POINT(${easting} ${northing})`;
        const cqlFilter = `INTERSECTS(geom, ${pointStr}) OR DWITHIN(geom, ${pointStr}, 0.2, meters)`;

        // 4. Consultar GeoServer vía WFS con Filtro CQL
        const wfsUrl = 'http://localhost:8080/geoserver/portal_jor/wfs?' +
            'service=WFS&version=1.1.0&request=GetFeature&' +
            'typeName=' + activeLayers.join(',') + '&' +
            'outputFormat=application/json&srsName=EPSG:32717&' +
            'cql_filter=' + encodeURIComponent(cqlFilter);

        try {
            const response = await fetch(wfsUrl);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                // Seleccionamos el resultado más relevante (el primero que GeoServer devuelva como intersección directa)
                const feature = data.features[0];
                const properties = feature.properties || {};
                const layerNameRaw = feature.id.split('.')[0];

                // A) Mostrar Panel de Atributos
                if (window.showFeatureInfo) {
                    let tituloCapa = "Detalles Capa";
                    if (layerNameRaw === 'pg_predios') tituloCapa = "Predios Afectados";
                    else if (layerNameRaw === 'pg_poligono') tituloCapa = "Inventario Polígonos";
                    else if (layerNameRaw === 'pg_linea') tituloCapa = "Inventario Líneas";
                    else if (layerNameRaw === 'pg_punto') tituloCapa = "Inventario Puntos";
                    else if (layerNameRaw === 'pg_poligonos_liberacion') tituloCapa = "Polígonos Liberación";

                    window.showFeatureInfo(properties, tituloCapa);
                }

                // B) Resaltar Geometría (Transformando de UTM a Mercator para el mapa)
                const geoJSONFormat = new ol.format.GeoJSON();
                const olFeature = geoJSONFormat.readFeature(feature, {
                    dataProjection: 'EPSG:32717',
                    featureProjection: 'EPSG:3857'
                });

                if (olFeature) {
                    highlightSource.addFeature(olFeature);
                }

                // C) Si es predio, disparar resumen de inventario
                if (layerNameRaw === 'pg_predios' && olFeature) {
                    if (typeof fetchInventorySummary === 'function') {
                        fetchInventorySummary(olFeature, properties.codigo || properties.cod_predio || "--");
                    }
                }
            }
        } catch (error) {
            console.error("Error en selección WFS:", error);
        } finally {
            document.getElementById('map').style.cursor = 'default';
        }
    });

    window.clearMapSelection = () => {
        highlightSource.clear();
        if (window.clearInventorySummary) window.clearInventorySummary();
    };

    // --- 6. Engineering Tools Buttons Setup ---
    document.getElementById('tool-zoom-in').addEventListener('click', () => {
        view.animate({ zoom: view.getZoom() + 1, duration: 250 });
    });

    document.getElementById('tool-zoom-out').addEventListener('click', () => {
        view.animate({ zoom: view.getZoom() - 1, duration: 250 });
    });

    document.getElementById('tool-clear').addEventListener('click', () => {
        if (window.clearMapSelection) window.clearMapSelection();
        if (window.hideFeatureInfo) window.hideFeatureInfo();
    });

    // --- 7. Search by Cadastral Code or owner (WFS Zoom-To-Feature) ---
    // --- 7. Búsqueda Multi-Capa con Lista de Resultados ---
    const searchLayers = [
        { layer: 'portal_jor:pg_predios', field: 'codigo', label: 'Predio Afectado' },
        { layer: 'portal_jor:pg_poligono', field: 'predio', label: 'Inventario Polígono' },
        { layer: 'portal_jor:pg_punto', field: 'predio', label: 'Inventario Punto' },
        { layer: 'portal_jor:pg_linea', field: 'Predio', label: 'Inventario Línea' }
    ];

    window.searchFeature = (query) => {
        if (!query || query.trim() === "") return;

        console.log("Iniciando búsqueda multi-capa para:", query);
        document.getElementById('map').style.cursor = 'wait';

        // Promesas para cada capa
        const searchPromises = searchLayers.map(cfg => {
            const cqlFilter = `${cfg.field} ILIKE '%${query}%'`;
            const url = 'http://localhost:8080/geoserver/portal_jor/wfs?' +
                'service=wfs&' +
                'version=1.1.0&' +
                'request=GetFeature&' +
                'typename=' + cfg.layer + '&' +
                'outputFormat=application/json&srsName=EPSG:32717&' +
                'cql_filter=' + encodeURIComponent(cqlFilter);

            return fetch(url)
                .then(res => res.text())
                .then(text => {
                    // Si es XML, registrar error pero no romper todo el proceso
                    if (text.trim().startsWith('<')) {
                        console.warn(`Error en capa ${cfg.layer}:`, text.substring(0, 100));
                        return [];
                    }
                    try {
                        const data = JSON.parse(text);
                        return (data.features || []).map(f => ({ ...f, _layerLabel: cfg.label, _layerName: cfg.layer }));
                    } catch (e) {
                        return [];
                    }
                })
                .catch(() => []);
        });

        Promise.all(searchPromises).then(resultsArray => {
            const allFeatures = resultsArray.flat();
            console.log("Total resultados:", allFeatures.length);

            if (window.renderSearchResults) {
                window.renderSearchResults(allFeatures);
            }

            if (allFeatures.length === 0) {
                alert('No se encontraron coincidencias para: ' + query);
            }
        }).finally(() => {
            document.getElementById('map').style.cursor = 'default';
        });
    };

    // Función para seleccionar un resultado de la lista
    window.selectSearchResult = (featureJson) => {
        if (!featureJson) return;

        console.log("Seleccionando resultado:", featureJson);
        const format = new ol.format.GeoJSON();

        let feature;
        try {
            feature = format.readFeature(featureJson, {
                dataProjection: 'EPSG:32717',
                featureProjection: 'EPSG:3857'
            });
        } catch (e) {
            console.error("Error al leer la geometría del feature:", e);
            alert("No se pudo procesar la geometría de este elemento.");
            return;
        }

        if (feature && feature.getGeometry()) {
            const geometry = feature.getGeometry();
            const extent = geometry.getExtent();

            // Validar que el extent sea razonable (no infinito o vacío)
            if (!ol.extent.isEmpty(extent) && isFinite(extent[0])) {
                // 1. Encender la capa automáticamente si está apagada
                const configLayer = searchLayers.find(l => l.layer === featureJson._layerName);
                if (configLayer) {
                    // Mapear nombre técnico a variable de capa
                    const layerMap = {
                        'portal_jor:pg_predios': prediosLayer,
                        'portal_jor:pg_poligono': poligonoLayer,
                        'portal_jor:pg_linea': lineaLayer,
                        'portal_jor:pg_punto': puntoLayer
                    };
                    const targetLayer = layerMap[featureJson._layerName];
                    if (targetLayer) {
                        targetLayer.setVisible(true);
                        // Sincronizar checkbox si existe
                        const chkId = featureJson._layerName.replace('portal_jor:', 'layer-');
                        const chk = document.getElementById(chkId);
                        if (chk) chk.checked = true;
                    }
                }

                // 2. Zoom suave al elemento
                view.fit(extent, {
                    duration: 1200,
                    maxZoom: 19,
                    padding: [100, 100, 100, 100],
                    callback: () => {
                        console.log("Zoom completado a:", extent);
                    }
                });

                // 3. Resaltar en la capa de selección
                highlightSource.clear();
                highlightSource.addFeature(feature);

                // 4. Mostrar panel de atributos
                if (window.showFeatureInfo) {
                    const props = feature.getProperties();
                    // Limpieza de metadatos de OpenLayers/GeoServer para el usuario
                    const cleanProps = {};
                    for (const [k, v] of Object.entries(props)) {
                        if (k !== 'geometry' && k !== 'bbox' && k !== '_layerLabel' && k !== '_layerName') {
                            cleanProps[k] = v;
                        }
                    }
                    window.showFeatureInfo(cleanProps, featureJson._layerLabel);
                }

                // 5. Si es predio, disparar resumen de inventario
                if (featureJson._layerName === 'portal_jor:pg_predios') {
                    const props = feature.getProperties();
                    if (typeof fetchInventorySummary === 'function') {
                        fetchInventorySummary(feature, props.codigo || props.cod_predio || "--");
                    }
                }
            } else {
                console.error("Extensión no válida para la geometría:", extent);
                alert("La ubicación de este elemento no es válida.");
            }
        } else {
            alert("Este elemento no contiene información geográfica para mostrar en el mapa.");
        }
    };

    // --- 8. Measurement Tool ---
    let draw;
    const measureSource = new ol.source.Vector();
    const measureLayer = new ol.layer.Vector({
        source: measureSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ba1a1a',
                width: 2,
                lineDash: [5, 5]
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({ color: '#ba1a1a' }),
                fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.5)' })
            })
        }),
        zIndex: 101
    });
    map.addLayer(measureLayer);

    const btnMeasure = document.getElementById('tool-measure');

    btnMeasure.addEventListener('click', () => {
        if (draw) {
            // Desactivar medición
            map.removeInteraction(draw);
            draw = null;
            btnMeasure.classList.remove('bg-primary', 'text-white');
            document.getElementById('map').style.cursor = 'default';
        } else {
            // Activar medición
            measureSource.clear();
            draw = new ol.interaction.Draw({
                source: measureSource,
                type: 'LineString',
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255, 0, 0, 0.7)',
                        width: 2
                    })
                })
            });

            map.addInteraction(draw);
            btnMeasure.classList.add('bg-primary', 'text-white');
            document.getElementById('map').style.cursor = 'crosshair';

            let listener;
            let tooltipElement;
            let tooltipOverlay;

            function createMeasureTooltip() {
                if (tooltipElement) {
                    tooltipElement.parentNode.removeChild(tooltipElement);
                }
                tooltipElement = document.createElement('div');
                tooltipElement.className = 'bg-slate-900/80 text-white px-2 py-1 rounded text-xs mt-4 ml-4 pointer-events-none';
                tooltipOverlay = new ol.Overlay({
                    element: tooltipElement, offset: [0, -15],
                    positioning: 'bottom-center', stopEvent: false, insertFirst: false
                });
                map.addOverlay(tooltipOverlay);
            }

            draw.on('drawstart', (evt) => {
                const sketch = evt.feature;
                createMeasureTooltip();

                listener = sketch.getGeometry().on('change', (e) => {
                    const geom = e.target;
                    let length = '0';
                    try {
                        const len = ol.sphere.getLength(geom, { projection: 'EPSG:3857' });
                        length = len > 100 ? (Math.round((len / 1000) * 100) / 100) + ' km' : (Math.round(len * 100) / 100) + ' m';
                    } catch (err) { length = '-- m'; }
                    tooltipElement.innerHTML = length;
                    tooltipOverlay.setPosition(geom.getLastCoordinate());
                });
            });

            draw.on('drawend', () => {
                tooltipElement.className = 'bg-primary text-white font-bold px-2 py-1 rounded text-xs mt-4 ml-4 pointer-events-none shadow-md';
                ol.Observable.unByKey(listener);
            });
        }
    });

    document.getElementById('tool-clear').addEventListener('click', () => {
        measureSource.clear();
        map.getOverlays().getArray().slice(0).forEach((overlay) => {
            if (overlay.getElement() && overlay.getElement().classList.contains('pointer-events-none')) {
                map.removeOverlay(overlay);
            }
        });
    });

    // --- 9. Auto-Zoom to Layer Extent on Start ---
    const zoomToPrediosExtent = () => {
        const wfsUrl = 'http://localhost:8080/geoserver/portal_jor/wfs?' +
            'service=wfs&version=1.1.0&request=GetFeature&' +
            'typename=portal_jor:pg_predios&resultType=hits';

        fetch(wfsUrl)
            .then(res => res.text())
            .then(xmlStr => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlStr, "text/xml");
                const lower = xml.getElementsByTagName('gml:lowerCorner')[0]?.textContent;
                const upper = xml.getElementsByTagName('gml:upperCorner')[0]?.textContent;

                if (lower && upper) {
                    const l = lower.split(' ').map(Number);
                    const u = upper.split(' ').map(Number);
                    // GeoServer WFS 1.1.0 logic for axis order
                    let extent4326;
                    if (l[0] > 0 || l[0] < -100) { // Likely Lat, Lon
                        extent4326 = [l[1], l[0], u[1], u[0]];
                    } else { // Likely Lon, Lat
                        extent4326 = [l[0], l[1], u[0], u[1]];
                    }
                    const extent3857 = ol.proj.transformExtent(extent4326, 'EPSG:4326', 'EPSG:3857');
                    view.fit(extent3857, { duration: 1500, padding: [100, 100, 100, 100] });
                }
            })
            .catch(err => {
                console.warn("No se pudo obtener la extensión automáticamente. Usando centro predefinido.");
            });
    };

    // setTimeout(zoomToPrediosExtent, 1000);

    // --- 9. Dashboard Logic ---
    let artdlChart = null;

    // Registrar el plugin de etiquetas
    Chart.register(ChartDataLabels);

    // [NUEVO] Plugin personalizado para dibujar las líneas de conexión
    const calloutPlugin = {
        id: 'calloutLines',
        afterDraw: (chart) => {
            const { ctx } = chart;
            ctx.save();

            const datasets = chart.data.datasets;
            if (!datasets.length || !datasets[0].data.length) return;

            const meta = chart.getDatasetMeta(0);
            const dataPoints = meta.data;
            const labels = [];

            // 1. Clasificar etiquetas: internas vs externas (callouts)
            dataPoints.forEach((datapoint, index) => {
                const value = datasets[0].data[index];
                if (value <= 0) return;

                const { x, y, startAngle, endAngle, outerRadius } = datapoint;
                const midAngle = startAngle + (endAngle - startAngle) / 2;
                const angularSpan = endAngle - startAngle;

                // Umbral para decidir si cabe dentro (en radianes, aprox 0.5 rad = 28 grados)
                const fitsInside = angularSpan > 0.5;

                if (fitsInside) {
                    // Dibujar inmediatamente dentro de la porción
                    const rx = x + Math.cos(midAngle) * (outerRadius * 0.6);
                    const ry = y + Math.sin(midAngle) * (outerRadius * 0.6);

                    ctx.font = '900 15px Inter';
                    ctx.fillStyle = '#10186f'; // Azul JOR
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(value.toString(), rx, ry);
                } else {
                    // Preparar para dibujo externo con callout
                    const x1 = x + Math.cos(midAngle) * outerRadius;
                    const y1 = y + Math.sin(midAngle) * outerRadius;
                    const x2 = x + Math.cos(midAngle) * (outerRadius + 25);
                    const y2 = y + Math.sin(midAngle) * (outerRadius + 25);

                    labels.push({
                        index,
                        value,
                        midAngle,
                        x1, y1,
                        x2, y2,
                        y3: y2,
                        side: Math.cos(midAngle) > 0 ? 'right' : 'left'
                    });
                }
            });

            // 2. Resolver colisiones verticales por lado (Izquierda / Derecha)
            const minGap = 28; // Espacio vertical mínimo entre etiquetas
            ['left', 'right'].forEach(side => {
                const sideLabels = labels.filter(l => l.side === side).sort((a, b) => a.y2 - b.y2);
                for (let i = 1; i < sideLabels.length; i++) {
                    if (sideLabels[i].y3 < sideLabels[i - 1].y3 + minGap) {
                        sideLabels[i].y3 = sideLabels[i - 1].y3 + minGap;
                    }
                }
            });

            // 3. Dibujar líneas y etiquetas
            labels.forEach(l => {
                const horizontalLen = 22;
                const x3 = l.side === 'right' ? l.x2 + horizontalLen : l.x2 - horizontalLen;

                // Línea de conexión con quiebre (Naranja Vibrante)
                ctx.beginPath();
                ctx.moveTo(l.x1, l.y1);
                ctx.lineTo(l.x2, l.y3);
                ctx.lineTo(x3, l.y3);
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2.5;
                ctx.lineJoin = 'round';
                ctx.stroke();

                // Dibujar el número sobre la línea horizontal (Azul JOR)
                ctx.font = '900 16px Inter';
                ctx.fillStyle = '#10186f';
                ctx.textAlign = l.side === 'right' ? 'right' : 'left';
                ctx.textBaseline = 'bottom';
                ctx.fillText(l.value.toString(), x3, l.y3 - 3);
            });

            ctx.restore();
        }
    };

    window.updateDashboard = async function () {
        const kpiTotal = document.getElementById('kpi-total-predios');
        const lastUpdateStr = document.getElementById('last-update');

        if (!kpiTotal) return;

        try {
            const url = 'http://localhost:8080/geoserver/portal_jor/wfs?' +
                'service=WFS&version=1.1.0&request=GetFeature&' +
                'typeName=portal_jor:pg_predios&outputFormat=application/json&' +
                'propertyName=cond_afec';

            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al conectar con GeoServer');

            const data = await response.json();
            const features = data.features || [];

            kpiTotal.innerText = features.length;

            const stats = {};
            features.forEach(f => {
                let val = f.properties.cond_afec || 'SIN CLASIFICAR';
                val = val.toUpperCase().trim();
                stats[val] = (stats[val] || 0) + 1;
            });

            const labels = Object.keys(stats).map(k => `${k} (${stats[k]})`);
            const counts = Object.values(stats);

            const colorMapping = {
                'DUPLICIDAD': '#cad2d3',
                'OCUPANTE': '#d6b6d6',
                'POSEEDOR': '#e5b3a3',
                'PROPIETARIO': '#f28b82'
            };

            const bgColors = Object.keys(stats).map(l => colorMapping[l] || '#cbd5e1');

            const ctx = document.getElementById('chart-artdl');
            if (!ctx) return;

            if (artdlChart) {
                artdlChart.destroy();
            }

            artdlChart = new Chart(ctx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: bgColors,
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 15
                    }]
                },
                plugins: [calloutPlugin], // Activar nuestro plugin de líneas
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: { top: 40, bottom: 20, left: 15, right: 15 }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            align: 'center',
                            labels: {
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 10,
                                boxWidth: 6,
                                font: {
                                    family: 'Inter',
                                    size: 9.5,
                                    weight: 'bold'
                                },
                                color: '#475569'
                            }
                        },
                        datalabels: {
                            display: false // Desactivamos el renderizado estándar para usar nuestro plugin personalizado
                        },
                        tooltip: {
                            backgroundColor: 'rgba(16, 24, 111, 0.9)',
                            callbacks: {
                                label: (item) => ` ${item.label}: ${item.raw} predios`
                            }
                        }
                    }
                }
            });

            const now = new Date();
            lastUpdateStr.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        } catch (error) {
            console.error('Error actualizando dashboard:', error);
            if (kpiTotal) kpiTotal.innerText = '--';
        }
    };

    setTimeout(window.updateDashboard, 1500);
});
