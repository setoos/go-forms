// quillConfig.ts
import { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';
import CustomImage from '../quill/ImageResizeBlot';
// Register the image resize module
Quill.register('modules/imageResize', ImageResize);
Quill.register(CustomImage, true);

export const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike', 'code'],
    [{ color: [] }, { background: [] }],
    [
      { list: 'ordered' },
      { list: 'bullet' },
      { indent: '-1' },
      { indent: '+1' }
    ],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
  imageResize: {
    modules: ['Resize', 'DisplaySize'],
  },
};

export const quillFormats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'color',
  'background',
  'list',
  'bullet',
  'indent',
  'align',
  'link',
  'image',
  'video',
];
