class ApiResponse {
    constructor(statusCode,data=null,message="",user=true){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=true
        this.user=user

    }
}

export default ApiResponse;