import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import { connect } from 'react-redux';
import data from './data.json';
import airportsData from './airports.json';
import * as Actions from './redux/AppStateReducer/ActionCreators';
import airportIcon from './assets/airport';
import SearchResult from './components/SearchResult/SearchResult';
import AutoComplete from './components/AutoComplete/AutoComplete';

function App({ loading, setLoading }) {
	const [map, setMap] = useState(null);
	const [citiesActive, setCitiesActive] = useState(false);
	const [airportsActive, setAirportsActive] = useState(false);
	const [json, setJson] = useState(null);
	const [cityName, setCityName] = useState('');
	// const [autoCompleteData, setAutoCompleteData] = useState([]);
	const [options, setOptions] = useState();
	// const [optionsSecondStep, setOptionsSecondStep] = useState();
	const [searchMarker, setSearchMarker] = useState(null);

	const [myJson, setmyJson] = useState(null);

	const airports = airportsData.filter(airport => {
		if (data.cities.find(city => airport.city === city.city)) {
			return true;
		} else {
			return false;
		}
	});

	const findCities = async cityName => {
		const url = `https://nominatim.openstreetmap.org/search?city=${cityName}&format=geojson`;
		fetch(url)
			.then(response => response.json())
			.then(data => {
				setJson(data.features);
			});
	};

	const findMyCities = geometry => {
		let lat1 = geometry[1];
		let lon1 = geometry[0];
		let distance = 20000;
		let rescity = {};
		let lat2, lon2, a, d;
		let p = 0.017453292519943295;
		let c = Math.cos;
		data.cities.forEach(e => {
			lat2 = e.lat;
			lon2 = e.lon;
			a =
				0.5 -
				c((lat2 - lat1) * p) / 2 +
				(c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;
			d = 12742 * Math.asin(Math.sqrt(a));
			if (d <= distance) {
				distance = d;
				rescity = {
					geometry: { coordinates: [lon2, lat2] },
					properties: { display_name: e.city },
				};
			}
		});
		let midata = [rescity];
		setmyJson(midata);
	};
	const findAutocomplete = async cityName => {
		const url = `https://photon.komoot.io/api/?q=${cityName}&osm_tag=place:city`;
		const response = await fetch(url);
		let data = (await response.json()).features;

		// const url = `https://nominatim.openstreetmap.org/search?city=${cityName}&format=geojson`;
		// const response = await fetch(url);
		// let data = (await response.json()).features;
		return data;
	};

	const resultClick = ({ geometry, display_name }) => {
		findMyCities(geometry);
		setSearchMarker({
			coordinates: {
				lat: geometry[1],
				lng: geometry[0],
			},
			name: display_name,
		});
		if (map) {
			map.flyTo({
				lat: geometry[1],
				lng: geometry[0],
			});
		}
	};

	const onChangeHandler = async text => {
		setCityName(text);
		let matches = [];
		if (text.length > 0) {
			const data = await findAutocomplete(text);
			matches = data.map(feature => feature.properties.name);

			matches = matches.filter((a, b) => matches.indexOf(a) === b);
		}

		setOptions(matches);
	};
	return (
		<div className="App">
			<div className="searchBox">
				<AutoComplete
					onChange={e => {
						onChangeHandler(e.target.value);
					}}
					placeholder="type city name"
					value={cityName}
					setValue={setCityName}
					options={options}
					setOptions={setOptions}
					findCities={findCities}
					resultClick={resultClick}
					json={json}
					setJson={setJson}
				/>
				<button
					className="searchBtn"
					onClick={() => {
						findCities(cityName);
					}}
				>
					search
				</button>
			</div>
			<div className="main">
				<MapContainer
					center={{ lat: 51.505, lng: -0.09 }}
					zoom={10}
					scrollWheelZoom={true}
					whenCreated={map => setMap(map)}
				>
					<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
					{citiesActive &&
						data.cities.map(city => (
							<Marker
								key={city.id}
								position={{ lat: city.lat, lng: city.lon }}
							>
								<Popup>{city.city}</Popup>
							</Marker>
						))}
					{airportsActive &&
						airports.map(airport => (
							<Marker
								key={airport.objectID}
								icon={airportIcon}
								position={{
									lat: airport._geoloc.lat,
									lng: airport._geoloc.lng,
								}}
							></Marker>
						))}
					{searchMarker && (
						<Marker position={searchMarker.coordinates}>
							<Popup>{searchMarker.name}</Popup>
						</Marker>
					)}
				</MapContainer>
				<div className="temp">
					<div className="checkBoxes">
						show cities:
						<input
							type="checkbox"
							checked={citiesActive}
							onChange={() => setCitiesActive(!citiesActive)}
						/>
						show airports:
						<input
							type="checkbox"
							checked={airportsActive}
							onChange={() => setAirportsActive(!airportsActive)}
						/>
					</div>
					<div className="myresults">
						{myJson &&
							myJson.map(city => (
								<SearchResult
									key={city.properties.display_name}
									city={city}
									resultClick={resultClick}
								/>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
const mapStateToProps = state => {
	return {
		loading: state.appState.loading,
	};
};
const mapDispatchToProps = dispatch => {
	return {
		setLoading: state => dispatch(Actions.setLoading(state)),
	};
};
export default connect(mapStateToProps, mapDispatchToProps)(App);
