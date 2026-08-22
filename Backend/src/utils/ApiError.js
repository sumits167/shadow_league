class ApiError extends Error{

    constructor(statusCode,message,code,isUser=true,details=null,stack){
      super(message)
        this.statusCode=statusCode
        this.code=code
        this.details=details
        this.success=false
        this.isUser=isUser

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
}


export default ApiError;