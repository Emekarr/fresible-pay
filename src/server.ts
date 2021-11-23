import('./app')
  .then(app => {
    app.default.listen(process.env.PORT as string, () => {
      console.log(`SERVER IS UP AND RUNNING ON PORT : ${process.env.PORT}`);
    });
  })
  .catch(err => console.log(`AN ERROR OCCURED WHILE STARTING THE SERVER :\n${err}`));
