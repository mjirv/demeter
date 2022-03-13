{% macro run_metric(metric_name, grain, dimensions=[], start_date=None, end_date=None, secondary_calculations=[], format='json') %}
    {% set res = run_query("select * from " ~ metrics.metric(metric_name, grain, dimensions, secondary_calculations, start_date, end_date)) %}

    {% do log("<<<MAPI-BEGIN>>>", info=True) %}
    {% if format == 'csv' %}
        {% do res.print_csv() %}
    {% else %}
        {% do res.print_json() %}
    {% endif %}
{% endmacro %}