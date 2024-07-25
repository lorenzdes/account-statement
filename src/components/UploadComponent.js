import React, { useState } from 'react';
import axios from 'axios';
import './UploadComponent.css';

const UploadComponent = () => {
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type !== 'text/csv') {
      setUploadError('Please upload a CSV file');
      setUploadSuccess('');
      return;
    }
    setFile(selectedFile);
    setUploadError('');
  };

  const handleFileUpload = () => {
    if (!file) {
      setUploadError('Please select a file to upload');
      setUploadSuccess('');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    axios.post('http://localhost:3005/upload', formData)
      .then(response => {
        console.log('File uploaded successfully:', response.data);
        setUploadError('');
        setUploadSuccess('File uploaded successfully');
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        setUploadError('Error uploading file. Please try again.');
        setUploadSuccess('');
      });
  };

  return (
    <div className="upload-container">
      <input type="file" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
      <label htmlFor="file-upload" className="upload-button">Import</label>
      <button onClick={handleFileUpload} className="upload-button">Upload</button>
      {uploadError && <p className="error">{uploadError}</p>}
      {uploadSuccess && <p className="success">{uploadSuccess}</p>}
    </div>
  );
};

export default UploadComponent;
