import Quill from 'quill';
import ImageResize from 'quill-image-resize-module-react';

const Image = Quill.import('formats/image');

export default class CustomImage extends Image {
  static create(value: any) {
    const node = super.create(value.url || value);
    if (value.width) node.setAttribute('width', value.width);
    if (value.height) node.setAttribute('height', value.height);
    return node;
  }

  static value(node: any) {
    return {
      url: node.getAttribute('src'),
      width: node.getAttribute('width'),
      height: node.getAttribute('height'),
    };
  }
}

CustomImage.blotName = 'image';
CustomImage.tagName = 'img';

Quill.register(CustomImage, true);
Quill.register('modules/imageResize', ImageResize);
