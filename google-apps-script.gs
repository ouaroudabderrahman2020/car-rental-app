/**
 * GOOGLE APPS SCRIPT: HEADLESS CAR FILE MANAGEMENT API
 * 
 * Deployment: Deploy as Web App, Execute as: Me, Access: Anyone.
 */

const CONFIG = {
  PARENT_FOLDER_ID: 'YOUR_FOLDER_ID_HERE'
};

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, payload } = request;
    let result;

    switch (action) {
      case 'upload':
        // Payload: { base64: string, fileName: string, contentType: string, plateNumber: string }
        const blob = Utilities.newBlob(
          Utilities.base64Decode(payload.base64), 
          payload.contentType, 
          payload.fileName
        );
        result = uploadCarFile(blob, payload.plateNumber);
        break;

      case 'update':
        // Payload: { oldFileId: string, base64: string, fileName: string, contentType: string, plateNumber: string }
        const updateBlob = Utilities.newBlob(
          Utilities.base64Decode(payload.base64), 
          payload.contentType, 
          payload.fileName
        );
        result = updateCarFile(payload.oldFileId, updateBlob, payload.plateNumber);
        break;

      case 'delete':
        // Payload: { fileId: string }
        result = deleteCarFile(payload.fileId);
        break;

      default:
        throw new Error('Unknown action: ' + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      data: result 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Basic upload: Creates Cars/[PlateNumber]/ and saves file.
 * Returns { fileId: string, url: string }
 */
function uploadCarFile(fileBlob, plateNumber) {
  const rootFolder = getOrCreateFolder(DriveApp.getFolderById(CONFIG.PARENT_FOLDER_ID), "Cars");
  const plateFolder = getOrCreateFolder(rootFolder, plateNumber);
  
  const file = plateFolder.createFile(fileBlob);
  // Set sharing so anyone with link can view (important for <img> thumbnails)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return {
    fileId: file.getId(),
    url: "https://drive.google.com/uc?export=view&id=" + file.getId()
  };
}

/**
 * Update logic: Trashes the old file before uploading the new one.
 */
function updateCarFile(oldFileId, newFileBlob, plateNumber) {
  if (oldFileId) {
    try {
      deleteCarFile(oldFileId);
    } catch (e) {
      // Log error but continue to upload new file to avoid blocking user
      console.warn("Could not trash old file: " + oldFileId + ". Error: " + e.message);
    }
  }
  return uploadCarFile(newFileBlob, plateNumber);
}

/**
 * Trashes a file by ID using move to trash (DriveApp method).
 */
function deleteCarFile(fileId) {
  if (!fileId) return { status: "ignored", message: "No fileId provided" };
  
  const file = DriveApp.getFileById(fileId);
  file.setTrashed(true);
  
  return { 
    status: "deleted", 
    fileId: fileId 
  };
}

/**
 * Utility: Gets a folder if it exists, otherwise creates it.
 */
function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parent.createFolder(name);
  }
}
