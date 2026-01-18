import httpClient from "./httpClient";

export const fetchEvents = () => httpClient.get("/events");

export const fetchEventDetails = eventId =>
  httpClient.get(`/events/${eventId}`);

export const fetchEventUploads = eventId =>
  httpClient.get(`/events/${eventId}/uploads`);

export const createEvent = payload => httpClient.post("/events", payload);

export const deleteEvent = eventId => httpClient.delete(`/events/${eventId}`);

export const getDownloadLink = (eventId, token) =>
  `${process.env.EXPO_PUBLIC_API_URL}/download/${eventId}${token ? `?token=${token}` : ""}`;

