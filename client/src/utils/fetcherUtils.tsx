export const extractValueFromFormData = (
  formData: FormData | undefined,
  formKey: string,
  defaultObj: object,
) => {
  return formData ? JSON.parse(formData.get(formKey) as string) : defaultObj;
};

export const createFormDataFromValue = (formKey: string, obj: object) => {
  const form = new FormData();
  form.append(formKey, JSON.stringify(obj));
  return form;
};
