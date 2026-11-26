import {
  handleNewsMonitorRequest,
  type ApiRequestLike,
  type ApiResponseLike,
} from '../server/prService.ts';

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  await handleNewsMonitorRequest(req, res);
}
