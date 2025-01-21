import React, { useState, useRef, useEffect, useCallback } from 'react';
import { database, useAuthState, uploadImage } from '../utilities/firebase';
import { ref, set } from 'firebase/database';
import Webcam from 'react-webcam';
import { FaMapMarkerAlt, FaAddressCard, FaCamera, FaUpload, FaPaperPlane } from 'react-icons/fa'; // Importar icono adicional
import './PostItemPage.css';

const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GEOCODING_API_KEY = 'AIzaSyB-d-ZlP2wvYgNwH7aTBNr3TKkx3J7UDBg'; // Asegúrate de mantener esta clave segura

const PostItemPage = () => {
    // Estados para el formulario
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [itemType, setItemType] = useState('lost'); // Dropdown para perdido o encontrado
    const [useCurrentLocation, setUseCurrentLocation] = useState(true); // Opción por defecto
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [stateAddr, setStateAddr] = useState(''); // Renombrado para evitar conflicto con React state
    const [zip, setZip] = useState('');
    const [loading, setLoading] = useState(false);
    const [user] = useAuthState();
    const [successMessage, setSuccessMessage] = useState(''); // Mensaje de éxito
    const [errorMessage, setErrorMessage] = useState(''); // Mensaje de error

    // Estados para la funcionalidad de la cámara
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const webcamRef = useRef(null);
    const [cameraError, setCameraError] = useState('');

    // Maneja el cambio de imagen desde el navegador de archivos
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setCapturedImage(null); // Reinicia la imagen capturada si existe
            console.log("Imagen seleccionada:", file);
        }
    };

    // Obtiene las coordenadas usando la API de Geocoding de Google
    const fetchCoordinates = async (address) => {
        console.log("Obteniendo coordenadas para:", address);
        const response = await fetch(`${GEOCODING_API_URL}?address=${encodeURIComponent(address)}&key=${GEOCODING_API_KEY}`);
        const data = await response.json();
        console.log("Respuesta de Geocoding:", data);
        if (data.status === 'OK' && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return { latitude: lat, longitude: lng };
        } else {
            throw new Error('Failed to fetch coordinates. Please check the address.');
        }
    };

    // Obtiene la ubicación actual del usuario usando la API de Geolocalización
    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser.'));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log("Ubicación obtenida:", position.coords);
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (error) => {
                        console.error("Error obteniendo ubicación:", error);
                        reject(new Error('Unable to retrieve your location.'));
                    }
                );
            }
        });
    };

    // Maneja el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Verifica si el usuario está autenticado
        if (!user) {
            alert("You need to be logged in to post an item.");
            return;
        }

        // Validaciones básicas del formulario
        if ((!image && !capturedImage) || !title.trim() || !description.trim()) {
            alert('Please provide a title, description, and an image.');
            return;
        }

        if (!useCurrentLocation) {
            if (!street.trim() || !city.trim() || !stateAddr.trim() || !zip.trim()) {
                alert('Please provide complete address information.');
                return;
            }
        }

        setLoading(true);
        setSuccessMessage(''); // Limpia mensajes anteriores
        setErrorMessage('');

        try {
            let coordinates = {};
            let fullAddress = '';

            if (useCurrentLocation) {
                // Obtiene las coordenadas usando la API de Geolocalización
                coordinates = await getCurrentLocation();
                fullAddress = 'Current Location';
            } else {
                // Construye la dirección completa desde los campos de entrada
                fullAddress = `${street}, ${city}, ${stateAddr}, ${zip}`;
                // Obtiene las coordenadas usando la API de Geocoding
                coordinates = await fetchCoordinates(fullAddress);
            }

            // Maneja la subida de la imagen
            let imageUrl = '';
            if (capturedImage) {
                // Convierte la Data URL capturada a un objeto Blob
                const blob = dataURLtoBlob(capturedImage);
                if (!blob) {
                    throw new Error('No se pudo convertir la imagen capturada a Blob.');
                }
                // Crea un archivo a partir del Blob
                const file = new File([blob], 'captured_image.jpg', { type: blob.type });
                console.log("Subiendo imagen capturada:", file);
                // Sube la imagen y obtiene la URL
                imageUrl = await uploadImage(file);
            } else if (image) {
                console.log("Subiendo imagen seleccionada:", image);
                // Sube la imagen seleccionada y obtiene la URL
                imageUrl = await uploadImage(image);
            }

            // Genera un ID único para el ítem
            const itemId = Date.now().toString();
            const itemPath = 'foundItems'; // Ajusta según sea necesario

            // Guarda los datos del ítem en Firebase Realtime Database
            await set(ref(database, `${itemPath}/${itemId}`), {
                title,
                description,
                imageUrl,
                postedBy: user.uid,
                timestamp: new Date().toISOString(),
                location: fullAddress,
                ...coordinates,
            });

            setSuccessMessage(`✅ Successfully posted a ${itemType} item!`);
            console.log("Ítem publicado exitosamente:", itemId);
            // Reinicia los campos del formulario
            setTitle('');
            setDescription('');
            setImage(null);
            setCapturedImage(null);
            setStreet('');
            setCity('');
            setStateAddr('');
            setZip('');
            setUseCurrentLocation(true); // Reinicia a la opción por defecto
        } catch (error) {
            console.error('Error posting item:', error);
            setErrorMessage(error.message || 'Failed to post item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Función utilitaria para convertir una Data URL a un objeto Blob
    function dataURLtoBlob(dataurl) {
        if (!dataurl) {
            throw new Error("La Data URL está vacía o es null.");
        }
        console.log("data url ->", dataurl);

        const arr = dataurl.split(',');
        if (arr.length !== 2) {
            throw new Error("Formato de Data URL inválido.");
        }

        console.log("arr ->", arr);
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) {
            throw new Error("No se pudo determinar el MIME type de la Data URL.");
        }

        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // Función para capturar la foto usando react-webcam
    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            const dataUrl = webcamRef.current.getScreenshot();
            if (dataUrl) {
                console.log("Data URL capturada:", dataUrl);
                setCapturedImage(dataUrl);
                setIsCameraOpen(false);
            } else {
                setCameraError('Failed to capture image.');
                console.error('Failed to capture image.');
            }
        }
    }, [webcamRef]);

    return (
        <div className="post-item-page">
            <h2>Post a found item</h2>
            {successMessage && <p className="success-message">{successMessage}</p>} {/* Muestra mensaje de éxito */}
            {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Muestra mensaje de error */}
            <form onSubmit={handleSubmit}>
                {/* Opciones de ubicación */}
                <div className="location-mode-buttons">
                    <button
                        type="button"
                        className={`location-button ${useCurrentLocation ? 'active' : ''}`}
                        onClick={() => setUseCurrentLocation(true)}
                    >
                        <FaMapMarkerAlt className="icon" /> Use Current Location
                    </button>
                    <button
                        type="button"
                        className={`location-button ${!useCurrentLocation ? 'active' : ''}`}
                        onClick={() => setUseCurrentLocation(false)}
                    >
                        <FaAddressCard className="icon" /> Enter Address Manually
                    </button>
                </div>

                {/* Campos de dirección manual */}
                {!useCurrentLocation && (
                    <div className="address-group">
                        <input
                            type="text"
                            placeholder="Street Address"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="input-field"
                            required={!useCurrentLocation}
                        />
                        <input
                            type="text"
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="input-field"
                            required={!useCurrentLocation}
                        />
                        <input
                            type="text"
                            placeholder="State"
                            value={stateAddr}
                            onChange={(e) => setStateAddr(e.target.value)}
                            className="input-field"
                            required={!useCurrentLocation}
                        />
                        <input
                            type="text"
                            placeholder="Zip Code"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                            className="input-field"
                            required={!useCurrentLocation}
                        />
                    </div>
                )}

                {/* Opciones de imagen */}
                <div className="image-input-options">
                    <div className="image-mode-buttons">
                        <button
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="image-button"
                        >
                            <FaCamera className="icon" /> Take Photo
                        </button>
                        <label className="image-button upload-label">
                            <FaUpload className="icon" /> Upload from Device
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    {/* Muestra el componente react-webcam si la cámara está abierta */}
                    {isCameraOpen && (
                        <div className="camera-container">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    facingMode: 'environment',
                                }}
                                className="video-stream"
                                onUserMediaError={(err) => {
                                    console.error("Error al acceder a la cámara:", err);
                                    setCameraError('Unable to access the camera. Please check permissions and try again.');
                                }}
                            />
                            {/* Marco de depuración sobre el video */}
                            <div className="video-overlay"></div>
                            <div className="camera-buttons">
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="capture-button"
                                >
                                    Capture Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCameraOpen(false)}
                                    className="close-camera-button"
                                >
                                    Cancel
                                </button>
                            </div>
                            {/* Muestra un mensaje de error si existe */}
                            {cameraError && <p className="error-message">{cameraError}</p>}
                        </div>
                    )}

                    {/* Previsualización de la imagen capturada */}
                    {capturedImage && (
                        <div className="image-preview">
                            <img src={capturedImage} alt="Captured" />
                            <button type="button" onClick={() => setCapturedImage(null)} className="remove-image-button">
                                Remove
                            </button>
                        </div>
                    )}

                    {/* Previsualización de la imagen subida */}
                    {image && !capturedImage && (
                        <div className="image-preview">
                            <img src={URL.createObjectURL(image)} alt="Uploaded" />
                            <button type="button" onClick={() => setImage(null)} className="remove-image-button">
                                Remove
                            </button>
                        </div>
                    )}
                </div>

                {/* Campos de título y descripción */}
                <input
                    type="text"
                    placeholder="Enter item title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    required
                />
                <textarea
                    placeholder="Enter item description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="textarea-field"
                    required
                />

                {/* Botón de publicación */}
                <button type="submit" className="submit-button" disabled={loading}>
                    <FaPaperPlane className="icon" /> {loading ? "Posting..." : `Post ${itemType} Item`}
                </button>
            </form>
        </div>
    );

};

export default PostItemPage;
