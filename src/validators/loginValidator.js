import { Type } from '@sinclair/typebox';
import Ajv from 'ajv';

// Define login schema
const LoginSchema = Type.Object({
  username: Type.String(),
  password: Type.String(),
});

// Ajv Instance
const ajv = new Ajv();

// Compile schema with ajv
const validate = ajv.compile(LoginSchema);

export const validateLogin = (data) => {
  const valid = validate(data);
  if (!valid) {
    throw new Error('Invalid login data');
  }
};
