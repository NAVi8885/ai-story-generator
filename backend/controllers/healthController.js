/**
 * Health Controller (MVC - Controller Layer)
 */

import { getActiveProviders } from '../services/inferenceRouterService.js';
import { presentJsonSuccess } from '../views/streamView.js';

export function getHealth(req, res) {
  presentJsonSuccess(res, {
    status: 'ok',
    message: 'Mythos Studio API v3.0 (MVC)',
    providers: getActiveProviders()
  });
}
