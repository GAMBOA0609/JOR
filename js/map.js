// Configurar Proj4 para UTM Zona 17 Sur (EPSG:32717)
if (typeof proj4 !== 'undefined') {
    proj4.defs("EPSG:32717", "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs");
    ol.proj.proj4.register(proj4);
}

// --- Configuración Supabase Cloud ---
const SUPABASE_URL = 'https://jqfezkbqkouwfbjermox.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y4KmGVSw5z14mvWU5RKsqw_pNADXw2B';

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

    // --- 2. Estilos Vectoriales Personalizados ---

    // Paleta de colores para condición de afectación (Predios)
    const condStyles = {
        'PROPIETARIO': { fill: 'rgba(242, 139, 130, 0.45)', stroke: '#d93025' },
        'POSEEDOR':    { fill: 'rgba(229, 179, 163, 0.45)', stroke: '#e06040' },
        'OCUPANTE':     { fill: 'rgba(214, 182, 214, 0.45)', stroke: '#8e24aa' },
        'DUPLICIDAD':   { fill: 'rgba(202, 210, 211, 0.45)', stroke: '#5f6368' }
    };

    const stylePredios = (feature, resolution) => {
        const cond = (feature.get('cond_afec') || '').toUpperCase().trim();
        const cfg = condStyles[cond] || { fill: 'rgba(42, 50, 133, 0.35)', stroke: '#10186f' };
        
        const styleObj = {
            stroke: new ol.style.Stroke({
                color: cfg.stroke,
                width: 2
            }),
            fill: new ol.style.Fill({
                color: cfg.fill
            })
        };

        // Mostrar etiqueta de código si hay zoom suficiente (resolución < 5m/pixel)
        if (resolution < 5) {
            const codigo = feature.get('codigo') || feature.get('cod_predio') || '';
            if (codigo) {
                styleObj.text = new ol.style.Text({
                    text: codigo,
                    font: 'bold 11px Inter, sans-serif',
                    fill: new ol.style.Fill({ color: '#10186f' }),
                    stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
                    overflow: true,
                    offsetY: -2
                });
            }
        }

        return new ol.style.Style(styleObj);
    };

    const styleLiberacion = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#2e7d32',
            width: 2,
            lineDash: [8, 4]
        }),
        fill: new ol.style.Fill({
            color: 'rgba(76, 175, 80, 0.25)'
        })
    });

    const styleInvPoligono = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#e65100',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255, 152, 0, 0.35)'
        })
    });

    const styleInvLinea = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#e53935',
            width: 3
        })
    });

    const styleInvPunto = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({ color: '#d81b60' }),
            stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
        })
    });

    const styleLimDepartamentos = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#0f172a',
            width: 2.2
        })
    });

    const styleLimProvincial = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#475569',
            width: 1.5,
            lineDash: [8, 4]
        })
    });

    const styleLimDistrital = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#94a3b8',
            width: 1,
            lineDash: [4, 4]
        })
    });

    // --- 3. Capas Vectoriales Conectadas a Supabase Cloud ---

    // Fuentes vectoriales (inicialmente vacías, se llenan asíncronamente)
    const prediosSource = new ol.source.Vector();
    const liberacionSource = new ol.source.Vector();
    const poligonoSource = new ol.source.Vector();
    const lineaSource = new ol.source.Vector();
    const puntoSource = new ol.source.Vector();
    const limDepartamentosSource = new ol.source.Vector();
    const limProvincialSource = new ol.source.Vector();
    const limDistritalSource = new ol.source.Vector();

    // Capas OpenLayers Vector
    const limDepartamentosLayer = new ol.layer.Vector({
        title: 'limDepartamentos',
        source: limDepartamentosSource,
        style: styleLimDepartamentos,
        opacity: 0.85,
        visible: true,
        zIndex: 5
    });

    const limProvincialLayer = new ol.layer.Vector({
        title: 'limProvincial',
        source: limProvincialSource,
        style: styleLimProvincial,
        opacity: 0.8,
        visible: true,
        zIndex: 6
    });

    const limDistritalLayer = new ol.layer.Vector({
        title: 'limDistrital',
        source: limDistritalSource,
        style: styleLimDistrital,
        opacity: 0.75,
        visible: true,
        zIndex: 7
    });

    const liberacionLayer = new ol.layer.Vector({
        title: 'liberacion',
        source: liberacionSource,
        style: styleLiberacion,
        opacity: 0.85,
        visible: true,
        zIndex: 10
    });

    const prediosLayer = new ol.layer.Vector({
        title: 'predios',
        source: prediosSource,
        style: stylePredios,
        opacity: 0.9,
        visible: true,
        zIndex: 20
    });

    const poligonoLayer = new ol.layer.Vector({
        title: 'poligono',
        source: poligonoSource,
        style: styleInvPoligono,
        opacity: 0.85,
        visible: true,
        zIndex: 25
    });

    const lineaLayer = new ol.layer.Vector({
        title: 'linea',
        source: lineaSource,
        style: styleInvLinea,
        opacity: 0.9,
        visible: true,
        zIndex: 30
    });

    const puntoLayer = new ol.layer.Vector({
        title: 'punto',
        source: puntoSource,
        style: styleInvPunto,
        opacity: 1.0,
        visible: true,
        zIndex: 35
    });

    // Capa de selección / resaltado Cyan Neón
    const highlightSource = new ol.source.Vector();
    const highlightLayer = new ol.layer.Vector({
        source: highlightSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#00ffff',
                width: 4
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 255, 255, 0.25)'
            }),
            image: new ol.style.Circle({
                radius: 9,
                fill: new ol.style.Fill({ color: 'rgba(0, 255, 255, 0.5)' }),
                stroke: new ol.style.Stroke({ color: '#00ffff', width: 3 })
            })
        }),
        zIndex: 100
    });

    // --- 4. Inicialización del Mapa OpenLayers ---
    const view = new ol.View({
        center: ol.proj.fromLonLat([-79.71995, -6.45399]),
        zoom: 13,
        maxZoom: 20
    });

    const map = new ol.Map({
        target: 'map',
        layers: [
            osmBase,
            satelliteLayer,
            limDepartamentosLayer,
            limProvincialLayer,
            limDistritalLayer,
            liberacionLayer,
            prediosLayer,
            poligonoLayer,
            lineaLayer,
            puntoLayer,
            highlightLayer
        ],
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

    window.map = map;

    // --- 5. Cargador Asíncrono de Capas desde Supabase Cloud ---
    const geoJSONFormat = new ol.format.GeoJSON();

    const loadLayerFromSupabase = async (tableName, source, onLoadedCallback) => {
        try {
            console.log(`[Supabase Cloud] Cargando capa: ${tableName}...`);
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_layer_geojson`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ layer_name: tableName })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} en capa ${tableName}`);
            }

            const geojsonData = await response.json();
            if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
                const olFeatures = geoJSONFormat.readFeatures(geojsonData, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });

                // Asignar metadato identificador de capa a cada feature
                olFeatures.forEach(f => f.set('_layerName', tableName));

                source.addFeatures(olFeatures);
                console.log(`[Supabase Cloud] ✓ ${tableName}: ${olFeatures.length} elementos cargados.`);
                
                if (onLoadedCallback) onLoadedCallback(olFeatures);
            } else {
                console.warn(`[Supabase Cloud] Capa ${tableName} vacía.`);
            }
        } catch (err) {
            console.error(`[Supabase Cloud] Error cargando ${tableName}:`, err);
        }
    };

    // Actualizar indicador de estado en la interfaz si existe
    const updateCloudStatus = (text, isSuccess = true) => {
        const badge = document.getElementById('cloud-status-badge');
        if (badge) {
            badge.innerHTML = `
                <span class="w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
                <span>${text}</span>
            `;
        }
    };

    // Cargar capas en paralelo priorizando las operativas de proyecto
    const initDataLoad = async () => {
        updateCloudStatus("Conectando a Supabase...");

        // 1. Cargar capas de proyecto (Rápidas y prioritarias)
        const projectPromises = [
            loadLayerFromSupabase('predios', prediosSource, (features) => {
                // Auto-ajustar vista a la extensión de predios en cuanto carguen
                if (features.length > 0) {
                    const extent = prediosSource.getExtent();
                    if (!ol.extent.isEmpty(extent)) {
                        view.fit(extent, { duration: 1200, padding: [60, 60, 60, 60] });
                    }
                }
            }),
            loadLayerFromSupabase('poligonos_liberacion', liberacionSource),
            loadLayerFromSupabase('poligono', poligonoSource),
            loadLayerFromSupabase('linea', lineaSource),
            loadLayerFromSupabase('punto', puntoSource)
        ];

        await Promise.all(projectPromises);
        updateCloudStatus("Supabase Cloud: Conectado ✓");

        // 2. Cargar capas de límites políticos en segundo plano
        loadLayerFromSupabase('lim_departamentos', limDepartamentosSource);
        loadLayerFromSupabase('lim_provincial', limProvincialSource);
        loadLayerFromSupabase('lim_distrital', limDistritalSource);
    };

    initDataLoad();

    // --- 6. Interacciones de Interfaz (Capas y Mapa Base) ---

    // Selector de Mapa Base
    const basemapSelect = document.getElementById('basemap-select');
    if (basemapSelect) {
        basemapSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            osmBase.setVisible(val === 'osm');
            satelliteLayer.setVisible(val === 'satellite');
        });
    }

    // Toggle de Capas
    const setupLayerToggle = (elementId, layer) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.addEventListener('change', (e) => layer.setVisible(e.target.checked));
        }
    };

    setupLayerToggle('layer-predios', prediosLayer);
    setupLayerToggle('layer-poligono', poligonoLayer);
    setupLayerToggle('layer-linea', lineaLayer);
    setupLayerToggle('layer-punto', puntoLayer);
    setupLayerToggle('layer-liberacion', liberacionLayer);
    setupLayerToggle('layer-lim-departamental', limDepartamentosLayer);
    setupLayerToggle('layer-lim-provincial', limProvincialLayer);
    setupLayerToggle('layer-lim-distrital', limDistritalLayer);

    // --- 7. Resumen de Inventario (Mejoras por Predio) ---
    const fetchInventorySummary = (predioFeature, predioCode) => {
        if (!predioCode || predioCode === '--') return;

        const allResults = {};
        const codeClean = String(predioCode).trim().toUpperCase();

        const processFeatures = (features, layerType) => {
            features.forEach(f => {
                const fPredio = String(f.get('predio') || f.get('Predio') || '').trim().toUpperCase();
                if (fPredio === codeClean) {
                    const val = String(f.get('tipo') || f.get('Tipo') || '');
                    if (val) {
                        let label = val;
                        let count = 1;

                        if (layerType === 'POLIGONO') {
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

                            if (layerType === 'PUNTO' && val !== "5") {
                                count = parseInt(f.get('num_plantas') || f.get('Num_Plantas') || 1, 10);
                            }
                        }

                        const upperLabel = label.toUpperCase();
                        allResults[upperLabel] = (allResults[upperLabel] || 0) + count;
                    }
                }
            });
        };

        processFeatures(poligonoSource.getFeatures(), 'POLIGONO');
        processFeatures(lineaSource.getFeatures(), 'LINEA');
        processFeatures(puntoSource.getFeatures(), 'PUNTO');

        if (window.renderInventorySummary) {
            window.renderInventorySummary(allResults, predioCode);
        }
    };

    // --- 8. Selección e Inspección por Clic en Pantalla ---
    map.on('singleclick', (evt) => {
        if (draw) return; // Si estamos midiendo, ignorar clic de selección

        // Limpiar selección previa
        highlightSource.clear();
        if (window.hideFeatureInfo) window.hideFeatureInfo();
        if (window.clearInventorySummary) window.clearInventorySummary();

        // Encontrar feature en el píxel clicado según prioridad de capas visibles
        let selectedFeature = null;
        let selectedLayerName = null;

        map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
            if (selectedFeature) return true; // ya encontramos uno
            if (!layer || layer === highlightLayer || layer === measureLayer) return false;

            const name = feat.get('_layerName') || layer.get('title');
            // Ignorar límites políticos si hay elementos de proyecto
            if (name === 'limDepartamentos' || name === 'limProvincial' || name === 'limDistrital') {
                return false;
            }

            selectedFeature = feat;
            selectedLayerName = name;
            return true;
        }, { hitTolerance: 5 });

        // Si no tocó capa de proyecto, buscar si tocó límite político
        if (!selectedFeature) {
            map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
                if (selectedFeature) return true;
                if (!layer || layer === highlightLayer || layer === measureLayer) return false;
                selectedFeature = feat;
                selectedLayerName = feat.get('_layerName') || layer.get('title');
                return true;
            }, { hitTolerance: 3 });
        }

        if (selectedFeature) {
            // A) Resaltar geometría en cyan
            highlightSource.addFeature(selectedFeature);

            // B) Preparar propiedades para el panel de atributos
            const rawProps = selectedFeature.getProperties();
            const cleanProps = {};
            for (const [k, v] of Object.entries(rawProps)) {
                if (k !== 'geometry' && k !== '_layerName' && k !== 'bbox') {
                    cleanProps[k] = v;
                }
            }

            let tituloCapa = "Detalles Capa";
            if (selectedLayerName === 'predios') tituloCapa = "Predios Afectados";
            else if (selectedLayerName === 'poligono') tituloCapa = "Inventario Polígonos";
            else if (selectedLayerName === 'linea') tituloCapa = "Inventario Líneas";
            else if (selectedLayerName === 'punto') tituloCapa = "Inventario Puntos";
            else if (selectedLayerName === 'poligonos_liberacion') tituloCapa = "Polígonos Liberación";
            else if (selectedLayerName === 'lim_departamentos') tituloCapa = "Límite Departamental";
            else if (selectedLayerName === 'lim_provincial') tituloCapa = "Límite Provincial";
            else if (selectedLayerName === 'lim_distrital') tituloCapa = "Límite Distrital";

            if (window.showFeatureInfo) {
                window.showFeatureInfo(cleanProps, tituloCapa);
            }

            // C) Si es predio, disparar resumen de inventario
            if (selectedLayerName === 'predios') {
                const code = cleanProps.codigo || cleanProps.cod_predio || "--";
                fetchInventorySummary(selectedFeature, code);
            }
        }
    });

    window.clearMapSelection = () => {
        highlightSource.clear();
        if (window.clearInventorySummary) window.clearInventorySummary();
    };

    // --- 9. Herramientas Flotantes (Zoom, Limpiar, Medición) ---
    document.getElementById('tool-zoom-in')?.addEventListener('click', () => {
        view.animate({ zoom: view.getZoom() + 1, duration: 250 });
    });

    document.getElementById('tool-zoom-out')?.addEventListener('click', () => {
        view.animate({ zoom: view.getZoom() - 1, duration: 250 });
    });

    document.getElementById('tool-clear')?.addEventListener('click', () => {
        if (window.clearMapSelection) window.clearMapSelection();
        if (window.hideFeatureInfo) window.hideFeatureInfo();
    });

    // Herramienta de Medición
    let draw;
    const measureSource = new ol.source.Vector();
    const measureLayer = new ol.layer.Vector({
        source: measureSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ba1a1a',
                width: 2.5,
                lineDash: [6, 6]
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({ color: '#ba1a1a', width: 2 }),
                fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.8)' })
            })
        }),
        zIndex: 101
    });
    map.addLayer(measureLayer);

    const btnMeasure = document.getElementById('tool-measure');
    if (btnMeasure) {
        btnMeasure.addEventListener('click', () => {
            if (draw) {
                map.removeInteraction(draw);
                draw = null;
                btnMeasure.classList.remove('bg-primary', 'text-white');
                document.getElementById('map').style.cursor = 'default';
            } else {
                measureSource.clear();
                draw = new ol.interaction.Draw({
                    source: measureSource,
                    type: 'LineString',
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(220, 38, 38, 0.8)',
                            width: 2.5
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
                    tooltipElement.className = 'bg-slate-900/90 text-white px-2.5 py-1 rounded text-xs mt-4 ml-4 pointer-events-none shadow-md';
                    tooltipOverlay = new ol.Overlay({
                        element: tooltipElement,
                        offset: [0, -15],
                        positioning: 'bottom-center',
                        stopEvent: false,
                        insertFirst: false
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
                            length = len > 1000 ? (Math.round((len / 1000) * 100) / 100) + ' km' : (Math.round(len * 10) / 10) + ' m';
                        } catch (err) { length = '-- m'; }
                        tooltipElement.innerHTML = length;
                        tooltipOverlay.setPosition(geom.getLastCoordinate());
                    });
                });

                draw.on('drawend', () => {
                    tooltipElement.className = 'bg-primary text-white font-bold px-2.5 py-1 rounded text-xs mt-4 ml-4 pointer-events-none shadow-lg';
                    ol.Observable.unByKey(listener);
                });
            }
        });
    }

    document.getElementById('tool-clear')?.addEventListener('click', () => {
        measureSource.clear();
        map.getOverlays().getArray().slice(0).forEach((overlay) => {
            if (overlay.getElement() && overlay.getElement().classList.contains('pointer-events-none')) {
                map.removeOverlay(overlay);
            }
        });
    });

    // --- 10. Búsqueda Multi-Criterio (Código Predial o Propietario) ---
    window.searchFeature = async (query) => {
        if (!query || query.trim() === "") return;

        const term = query.trim();
        console.log("[Supabase Cloud] Buscando coincidencias para:", term);
        document.getElementById('map').style.cursor = 'wait';

        try {
            // 1. Buscar en tabla 'predios' por código O por nombre de afectado
            const prediosUrl = `${SUPABASE_URL}/rest/v1/predios?or=(codigo.ilike.*${encodeURIComponent(term)}*,afectado.ilike.*${encodeURIComponent(term)}*)&select=*&limit=30`;
            const prediosRes = await fetch(prediosUrl, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            const prediosList = await prediosRes.json();

            const allResults = [];

            if (Array.isArray(prediosList)) {
                prediosList.forEach(p => {
                    // Encontrar el feature geométrico correspondiente en memoria
                    const olFeat = prediosSource.getFeatures().find(f => {
                        const c = f.get('codigo');
                        return c && String(c).trim().toUpperCase() === String(p.codigo).trim().toUpperCase();
                    });

                    allResults.push({
                        _layerLabel: 'Predio Afectado',
                        _layerName: 'predios',
                        _olFeature: olFeat,
                        properties: p,
                        geometry: olFeat ? { type: 'Polygon' } : null
                    });
                });
            }

            // 2. Buscar también en las capas de inventario por código de predio
            const searchInvSource = (source, label, layerName) => {
                source.getFeatures().forEach(f => {
                    const pCode = String(f.get('predio') || f.get('Predio') || '');
                    if (pCode.toLowerCase().includes(term.toLowerCase())) {
                        allResults.push({
                            _layerLabel: label,
                            _layerName: layerName,
                            _olFeature: f,
                            properties: f.getProperties(),
                            geometry: { type: f.getGeometry().getType() }
                        });
                    }
                });
            };

            searchInvSource(poligonoSource, 'Inventario Polígono', 'poligono');
            searchInvSource(lineaSource, 'Inventario Línea', 'linea');
            searchInvSource(puntoSource, 'Inventario Punto', 'punto');

            console.log(`[Supabase Cloud] Total resultados encontrados: ${allResults.length}`);

            if (window.renderSearchResults) {
                window.renderSearchResults(allResults);
            }

            if (allResults.length === 0) {
                alert('No se encontraron coincidencias para: ' + term);
            }
        } catch (err) {
            console.error("Error en búsqueda:", err);
            alert("Error al realizar la búsqueda en Supabase.");
        } finally {
            document.getElementById('map').style.cursor = 'default';
        }
    };

    // Seleccionar resultado desde la lista de búsqueda
    window.selectSearchResult = (item) => {
        if (!item) return;

        let olFeat = item._olFeature;

        // Si no estaba asociado el feature en memoria, buscarlo en prediosSource
        if (!olFeat && item._layerName === 'predios' && item.properties?.codigo) {
            olFeat = prediosSource.getFeatures().find(f => f.get('codigo') === item.properties.codigo);
        }

        if (olFeat && olFeat.getGeometry()) {
            const geom = olFeat.getGeometry();
            const extent = geom.getExtent();

            // 1. Encender la capa correspondiente si está apagada
            const layerMap = {
                'predios': { layer: prediosLayer, chkId: 'layer-predios' },
                'poligono': { layer: poligonoLayer, chkId: 'layer-poligono' },
                'linea': { layer: lineaLayer, chkId: 'layer-linea' },
                'punto': { layer: puntoLayer, chkId: 'layer-punto' }
            };

            const target = layerMap[item._layerName];
            if (target) {
                target.layer.setVisible(true);
                const chk = document.getElementById(target.chkId);
                if (chk) chk.checked = true;
            }

            // 2. Zoom suave al elemento
            view.fit(extent, {
                duration: 1000,
                maxZoom: 18,
                padding: [100, 100, 100, 100]
            });

            // 3. Resaltar en cyan
            highlightSource.clear();
            highlightSource.addFeature(olFeat);

            // 4. Mostrar panel de atributos
            if (window.showFeatureInfo) {
                const props = olFeat.getProperties();
                const cleanProps = {};
                for (const [k, v] of Object.entries(props)) {
                    if (k !== 'geometry' && k !== '_layerName' && k !== 'bbox') {
                        cleanProps[k] = v;
                    }
                }
                window.showFeatureInfo(cleanProps, item._layerLabel);
            }

            // 5. Si es predio, resumir inventario
            if (item._layerName === 'predios') {
                const code = olFeat.get('codigo') || olFeat.get('cod_predio') || "--";
                fetchInventorySummary(olFeat, code);
            }
        } else {
            alert("No se pudo ubicar geográficamente el elemento seleccionado.");
        }
    };

    // --- 11. Dashboard Estadístico (Chart.js + Supabase) ---
    let artdlChart = null;

    // Registrar el plugin de etiquetas
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    // Plugin para dibujar las líneas conectoras de porcentajes/valores (Callouts)
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

            dataPoints.forEach((datapoint, index) => {
                const value = datasets[0].data[index];
                if (value <= 0) return;

                const { x, y, startAngle, endAngle, outerRadius } = datapoint;
                const midAngle = startAngle + (endAngle - startAngle) / 2;
                const angularSpan = endAngle - startAngle;

                const fitsInside = angularSpan > 0.5;

                if (fitsInside) {
                    const rx = x + Math.cos(midAngle) * (outerRadius * 0.6);
                    const ry = y + Math.sin(midAngle) * (outerRadius * 0.6);

                    ctx.font = '900 15px Inter, sans-serif';
                    ctx.fillStyle = '#10186f';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(value.toString(), rx, ry);
                } else {
                    const x1 = x + Math.cos(midAngle) * outerRadius;
                    const y1 = y + Math.sin(midAngle) * outerRadius;
                    const x2 = x + Math.cos(midAngle) * (outerRadius + 22);
                    const y2 = y + Math.sin(midAngle) * (outerRadius + 22);

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

            const minGap = 26;
            ['left', 'right'].forEach(side => {
                const sideLabels = labels.filter(l => l.side === side).sort((a, b) => a.y2 - b.y2);
                for (let i = 1; i < sideLabels.length; i++) {
                    if (sideLabels[i].y3 < sideLabels[i - 1].y3 + minGap) {
                        sideLabels[i].y3 = sideLabels[i - 1].y3 + minGap;
                    }
                }
            });

            labels.forEach(l => {
                const horizontalLen = 18;
                const x3 = l.side === 'right' ? l.x2 + horizontalLen : l.x2 - horizontalLen;

                ctx.beginPath();
                ctx.moveTo(l.x1, l.y1);
                ctx.lineTo(l.x2, l.y3);
                ctx.lineTo(x3, l.y3);
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.stroke();

                ctx.font = '900 15px Inter, sans-serif';
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
            console.log("[Supabase Cloud] Actualizando métricas del dashboard...");
            const response = await fetch(`${SUPABASE_URL}/rest/v1/predios?select=cond_afec`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) throw new Error('Error al conectar con Supabase REST');

            const rows = await response.json();
            kpiTotal.innerText = rows.length;

            const stats = {};
            rows.forEach(r => {
                let val = r.cond_afec || 'SIN CLASIFICAR';
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
                        hoverOffset: 12
                    }]
                },
                plugins: [calloutPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: { top: 30, bottom: 15, left: 10, right: 10 }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            align: 'center',
                            labels: {
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 8,
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
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(16, 24, 111, 0.95)',
                            callbacks: {
                                label: (item) => ` ${item.label}: ${item.raw} predios`
                            }
                        }
                    }
                }
            });

            const now = new Date();
            if (lastUpdateStr) {
                lastUpdateStr.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

        } catch (error) {
            console.error('[Supabase Cloud] Error actualizando dashboard:', error);
            if (kpiTotal) kpiTotal.innerText = '--';
        }
    };

    // Disparar carga del dashboard al inicio
    setTimeout(window.updateDashboard, 500);
});
