const cors = (options) => {
  return (req, res, next) => {
    const allowedOrigin = options.origin || '*';  
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin, 
      'Access-Control-Allow-Methods': options.methods || 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': options.allowedHeaders || 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return res.status(204).set(corsHeaders).end();
    }

    res.set(corsHeaders);
    next();  
  };
};

export default cors;
