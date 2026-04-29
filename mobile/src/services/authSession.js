/**
 * Simple singleton service to hold non-serializable auth data
 * during the sign-in flow (e.g. Firebase confirmationResult)
 */
let confirmationResult = null;

export const authSession = {
    setConfirmationResult: (result) => {
        confirmationResult = result;
    },
    getConfirmationResult: () => {
        return confirmationResult;
    },
    clear: () => {
        confirmationResult = null;
    }
};
