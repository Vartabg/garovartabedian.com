import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// The models contain their own PNG and JPEG textures. Use browser image elements so
// their temporary blob URLs are decoded under the site's image policy.
export const characterLoader = new GLTFLoader().register(parser => {
  parser.textureLoader = new TextureLoader(parser.options.manager)
    .setCrossOrigin(parser.options.crossOrigin)
    .setRequestHeader(parser.options.requestHeader);
  return { name: 'HermonCharacterImages' };
});
