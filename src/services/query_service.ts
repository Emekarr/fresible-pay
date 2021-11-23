import CustomError from '../utils/error';

class QueryService {
	checkIfNull(data: any[]) {
		if (data.includes(null) || data.includes(undefined)) {
			throw new CustomError('Please pass in the required data', 400);
		}
	}
}

export default new QueryService();
