import {handleSynthesis} from '../../server/synthesis.mjs';
export const onRequest=({request})=>handleSynthesis(request);
