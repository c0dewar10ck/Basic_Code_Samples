import axios from "axios";
import * as gbl from "./serviceHelpers";

const create = payload => {
  const token = gbl.getAuthBearer();
  const url = "/api/characters";
  const config = {
    headers: { Authorization: "Bearer " + token }
  };

  return axios.post(url, payload, config).catch(err => console.error(err));
};

const update = payload => {
  const token = gbl.getAuthBearer();
  const url = "/api/characters/" + payload.id;
  const config = {
    headers: { Authorization: "Bearer " + token }
  };

  return axios.put(url, payload, config).catch(err => console.error(err));
};

const getPageByUser = queries => {
  const token = gbl.getAuthBearer();
  const url = "/api/characters/me?" + gbl.qs.stringify(queries);
  const config = {
    headers: { Authorization: "Bearer " + token }
  };

  return axios.get(url, config).catch(err => console.error(err));
};

export { create, update, getPageByUser };
