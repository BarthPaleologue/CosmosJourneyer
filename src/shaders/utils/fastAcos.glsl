// https://stackoverflow.com/questions/3380628/fast-arc-cos-algorithm
float fastAcos(float x) {
    float negate = 0.0;
    if(x < 0.0) negate = 1.0; //float(x < 0);
    x = abs(x);
    float ret = -0.0187293;
    ret = ret * x;
    ret = ret + 0.0742610;
    ret = ret * x;
    ret = ret - 0.2121144;
    ret = ret * x;
    ret = ret + 1.5707288;
    ret = ret * sqrt(1.0-x);
    ret = ret - 2.0 * negate * ret;
    return negate * 3.14159265358979 + ret;
}