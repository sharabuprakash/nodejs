// core components
import HeaderDefault from 'components/Headers/HeaderDefault.js';
import Sidebar from 'components/Sidebar/Sidebar.js';
import React from 'react';
// react plugin used to create google maps
import {
	GoogleMap,
	Marker,
	withGoogleMap,
	withScriptjs,
} from 'react-google-maps';
// reactstrap components
import { Card, CardHeader, Container, Row } from 'reactstrap';
import routes from 'routes.js';
import APP_CONFIG from '../../config';

// mapTypeId={google.maps.MapTypeId.ROADMAP}
const MapWrapper = withScriptjs(
	withGoogleMap((props) => (
		<GoogleMap
			defaultZoom={12}
			defaultCenter={{ lat: 40.748817, lng: -73.985428 }}
			defaultOptions={{
				scrollwheel: false,
				styles: [
					{
						featureType: 'administrative',
						elementType: 'labels.text.fill',
						stylers: [{ color: '#444444' }],
					},
					{
						featureType: 'landscape',
						elementType: 'all',
						stylers: [{ color: '#f2f2f2' }],
					},
					{
						featureType: 'poi',
						elementType: 'all',
						stylers: [{ visibility: 'off' }],
					},
					{
						featureType: 'road',
						elementType: 'all',
						stylers: [{ saturation: -100 }, { lightness: 45 }],
					},
					{
						featureType: 'road.highway',
						elementType: 'all',
						stylers: [{ visibility: 'simplified' }],
					},
					{
						featureType: 'road.arterial',
						elementType: 'labels.icon',
						stylers: [{ visibility: 'off' }],
					},
					{
						featureType: 'transit',
						elementType: 'all',
						stylers: [{ visibility: 'off' }],
					},
					{
						featureType: 'water',
						elementType: 'all',
						stylers: [{ color: '#5e72e4' }, { visibility: 'on' }],
					},
				],
			}}>
			<Marker position={{ lat: 40.748817, lng: -73.985428 }} />
		</GoogleMap>
	)),
);

class Maps extends React.Component {
	render() {
		return (
			<>
				<HeaderDefault />
				{/* Page content */}
				<Container className="mt--7">
					<Row>
						<div className="col">
							<Card className="shadow border-0">
								<CardHeader className=" bg-transparent">
									<Sidebar
										{...this.props}
										routes={routes}
										logo={{
											innerLink: '/default/maps',
											imgSrc: require('assets/img/brand/logo_' +
												APP_CONFIG.LOGO +
												'.png'),
											imgAlt: '...',
										}}
									/>
								</CardHeader>
								<MapWrapper
									googleMapURL="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY_HERE"
									loadingElement={
										<div style={{ height: `100%` }} />
									}
									containerElement={
										<div
											style={{ height: `600px` }}
											className="map-canvas"
											id="map-canvas"
										/>
									}
									mapElement={
										<div
											style={{
												height: `100%`,
												borderRadius: 'inherit',
											}}
										/>
									}
								/>
							</Card>
						</div>
					</Row>
				</Container>
			</>
		);
	}
}

export default Maps;
