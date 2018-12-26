const getYearDirectory = async ({ drive, cache }, parentID, year) => {
  console.log("Getting year directory for", year);
  let yearDirectory = cache[year];

  if (!yearDirectory) {
    console.log("FETCHING DIRECTORY");
    let q = `name = "${year}" and "${parentID}" in parents and trashed = false`;
    await drive.files
      .list({ q })
      .then(({ data }) => {
        let directory = data.files[0];
        yearDirectory = directory && directory.id;
      })
      .catch(error => console.log(error));
  }

  // ABSTRACT
  if (!yearDirectory) {
    console.log("CREATING DIRECTORY");
    let resource = {
      name: `${year}`,
      parents: [parentID],
      mimeType: "application/vnd.google-apps.folder"
    };
    await drive.files
      .create({ resource, fields: "id" })
      .then(({ data }) => {
        yearDirectory = data.id;
      })
      .catch(error => console.log(error));
  }

  if (yearDirectory) {
    cache[year] = yearDirectory;
  }

  return yearDirectory;
};

module.exports = getYearDirectory;
