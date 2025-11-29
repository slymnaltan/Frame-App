import httpClient from "./httpClient";
import { API_BASE_URL } from "../utils/constants";

export const fetchEvents = () => httpClient.get("/events");

export const fetchEventDetails = eventId =>
  httpClient.get(`/events/${eventId}`);

export const fetchEventUploads = eventId =>
  httpClient.get(`/events/${eventId}/uploads`);

export const createEvent = payload => httpClient.post("/events", payload);

export const getDownloadLink = (eventId, token) =>
  `${API_BASE_URL}/download/${eventId}${token ? `?token=${token}` : ""}`;

