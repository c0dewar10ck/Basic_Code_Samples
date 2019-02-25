import React, { PureComponent } from "react";
import { Form, FormGroup, Label, Input, Button } from "reactstrap";
import * as accountsService from "../../services/accountsService";
import * as schemas from "../../models/accountSchemas";
import { Formik } from "formik";
import * as prompts from "../NotificationMessage";

export default class EmailAndUsernameUpdate extends PureComponent {
  constructor(props) {
    super(props);
    this.validation = schemas.getEmailUsernameSchema;
    this.userId = this.props.currentUser.id;
    this.state = {
      data: this.validation.initialValues
    };
  }

  componentDidMount() {
    accountsService
      .getAccount(this.userId)
      .then(this.onGetSuccess)
      .catch(this.onFail);
  }

  onUpdateSuccess = () => {
    prompts.success({
      message: "Updated Successfully"
    });
    this.props.handleCancel && this.props.handleCancel();
  };

  onGetSuccess = response => {
    const data = {
      userName: response.item.userName,
      emailAddress: response.item.emailAddress
    };
    this.setState({
      data
    });
  };

  onUpdateFail = err => {
    console.error(err);
    prompts.success({
      message: "Oops! Something went wrong."
    });
  };

  handleSubmit = (values, obj) => {
    values.id = this.userId;
    accountsService
      .updateUser(values)
      .then(this.onUpdateSuccess)
      .catch(this.onFail)
      .then(() => {
        obj.setSubmitting(false);
      });
  };

  render() {
    const { extProviders } = this.props.currentUser;
    return (
      <Formik
        enableReinitialize={true}
        initialValues={this.state.data}
        onSubmit={this.handleSubmit}
        validationSchema={this.validation()}
      >
        {props => {
          const {
            values,
            touched,
            errors,
            isSubmitting,
            handleChange,
            handleBlur,
            handleSubmit
          } = props;

          return (
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <div style={{ margin: "1rem 0" }}>
                  <Label for="userName">Username</Label>
                  <Input
                    id="userName"
                    type="text"
                    value={values.userName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={
                      errors.userName && touched.userName ? "is-invalid" : ""
                    }
                  />
                  {errors.userName && touched.userName && (
                    <span
                      className="invalid-feedback"
                      style={{ display: "block" }}
                    >
                      {errors.userName}
                    </span>
                  )}
                </div>
                <div style={{ margin: "1rem 0" }}>
                  <Label for="emailAddress">
                    Email Address{" "}
                    {extProviders && extProviders.length > 0 && (
                      <small style={{ color: "red", marginLeft: "5px" }}>
                        Updating emails for externally linked accounts
                        (Facebook, Google, etc.) is not currently supported
                      </small>
                    )}
                  </Label>
                  <Input
                    id="emailAddress"
                    type="emailAddress"
                    value={values.emailAddress}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={extProviders && extProviders.length > 0}
                    className={
                      errors.emailAddress && touched.emailAddress
                        ? "is-invalid"
                        : ""
                    }
                  />
                  {errors.emailAddress && touched.emailAddress && (
                    <span
                      className="invalid-feedback"
                      style={{ display: "block" }}
                    >
                      {errors.emailAddress}
                    </span>
                  )}
                </div>
              </FormGroup>
              <div className="d-flex">
                <button
                  type="submit"
                  className="btn btn-primary ml-auto submitForm"
                  disabled={isSubmitting}
                >
                  Submit
                </button>
                {this.props.handleCancel && (
                  <Button
                    type="button"
                    color="secondary"
                    className="ml-2 submitForm"
                    onClick={this.props.handleCancel}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>
    );
  }
}
